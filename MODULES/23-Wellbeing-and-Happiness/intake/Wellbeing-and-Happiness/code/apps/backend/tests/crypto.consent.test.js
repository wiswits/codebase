// tests/crypto.consent.test.js — Week 2 (consent & crypto)

const crypto = require('crypto');

process.env.WB_MASTER_KEY = process.env.WB_MASTER_KEY || 'test-master-key-abcdef 0123456789';
process.env.WB_REPORT_SALT = process.env.WB_REPORT_SALT || 'test-report-salt';

const kms = require('../src/modules/wellbeing/wellbeing.kms');
const {
  aesEncrypt, aesDecrypt, getStudentKey, encryptJournal, decryptJournal, reporterHash,
} = require('../src/modules/wellbeing/wellbeing.crypto');
const { Forbidden, BadRequest } = require('../src/modules/wellbeing/wellbeing.errors');
const {
  ageBandFor, consentPolicy, isParticipating, hasRequiredConsent, buildOptOut,
} = require('../src/modules/wellbeing/wellbeing.consent');

// An in-memory stand-in for the wb_journal_key table.
function fakeDb() {
  const keys = new Map();
  return {
    async queryOne(sql, [student_id]) {
      return keys.has(student_id) ? { key_encrypted: keys.get(student_id) } : null;
    },
    async query(sql, [student_id, wrapped]) {
      keys.set(student_id, wrapped);
      return [];
    },
  };
}

describe('🔐 KMS wrap/unwrap', () => {
  it('round-trips a DEK', () => {
    const dek = crypto.randomBytes(32);
    expect(kms.unwrap(kms.wrap(dek)).equals(dek)).toBe(true);
  });

  it('produces different ciphertext each wrap (random IV)', () => {
    const dek = crypto.randomBytes(32);
    expect(kms.wrap(dek).equals(kms.wrap(dek))).toBe(false);
  });

  it('a tampered wrapped key fails authentication', () => {
    const wrapped = kms.wrap(crypto.randomBytes(32));
    wrapped[wrapped.length - 1] ^= 0xff;
    expect(() => kms.unwrap(wrapped)).toThrow();
  });
});

describe('🔐 AES-256-GCM journal primitives', () => {
  it('round-trips plaintext', () => {
    const key = crypto.randomBytes(32);
    const enc = aesEncrypt(key, 'aaj mann bhaari hai');
    expect(aesDecrypt(key, enc)).toBe('aaj mann bhaari hai');
  });

  it('ciphertext contains no plaintext (PROVE IT)', async () => {
    const db = fakeDb();
    const enc = await encryptJournal({ student_id: 7, plaintext: 'UNIQUE_SECRET_STRING_12345' }, db);
    const blob = enc.body_encrypted.toString('latin1');
    expect(blob).not.toContain('UNIQUE_SECRET_STRING_12345');
    expect(blob).not.toMatch(/UNIQUE/i);
  });

  it('a different student cannot decrypt with their own key', async () => {
    const db = fakeDb();
    const enc = await encryptJournal({ student_id: 7, plaintext: 'private' }, db);
    const otherKey = await getStudentKey(8, db);
    expect(() => aesDecrypt(otherKey, enc)).toThrow(); // GCM auth fails
  });
});

describe('📔 decryptJournal — the access promise', () => {
  const baseRow = { id: 1, org_id: 1, student_id: 7, shared_with_counsellor: 0 };

  async function makeRow(db, { student_id = 7, plaintext = 'meri baat', shared = 0 } = {}) {
    const enc = await encryptJournal({ student_id, plaintext }, db);
    return { ...baseRow, student_id, ...enc, shared_with_counsellor: shared };
  }

  it('the owner can read their own entry', async () => {
    const db = fakeDb();
    const row = await makeRow(db, { plaintext: 'sirf meri' });
    const out = await decryptJournal({ row, actor_id: 7, actor_role: 'student' }, db);
    expect(out).toBe('sirf meri');
  });

  it('a counsellor CANNOT read an unshared entry', async () => {
    const db = fakeDb();
    const row = await makeRow(db, { shared: 0 });
    await expect(
      decryptJournal({ row, actor_id: 99, actor_role: 'counsellor', reason: 'checking on student' }, db)
    ).rejects.toThrow(Forbidden);
  });

  it('a teacher can never read a journal', async () => {
    const db = fakeDb();
    const row = await makeRow(db, { shared: 1 }); // even if shared, only counsellor
    await expect(
      decryptJournal({ row, actor_id: 5, actor_role: 'teacher', reason: 'curious about student' }, db)
    ).rejects.toThrow(Forbidden);
  });

  it('a counsellor CAN read a shared entry, with a reason, and it is audited', async () => {
    const db = fakeDb();
    const audit = jest.fn();
    const row = await makeRow(db, { plaintext: 'shared with you', shared: 1 });
    const out = await decryptJournal(
      { row, actor_id: 99, actor_role: 'counsellor', reason: 'reviewing shared entry for case', auditRead: audit },
      db
    );
    expect(out).toBe('shared with you');
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][0]).toMatchObject({ subject_type: 'journal', action: 'view' });
  });

  it('a counsellor reading a shared entry WITHOUT a reason is rejected', async () => {
    const db = fakeDb();
    const row = await makeRow(db, { shared: 1 });
    await expect(
      decryptJournal({ row, actor_id: 99, actor_role: 'counsellor', reason: 'x' }, db)
    ).rejects.toThrow(BadRequest);
  });
});

describe('🕊 reporterHash — daily rotation, not reversible', () => {
  it('is stable within a day', () => {
    const d = new Date('2026-07-16T09:00:00Z');
    expect(reporterHash(42, 1, d)).toBe(reporterHash(42, 1, d));
  });

  it('rotates across days (same student → different hash)', () => {
    const h1 = reporterHash(42, 1, new Date('2026-07-16T09:00:00Z'));
    const h2 = reporterHash(42, 1, new Date('2026-07-17T09:00:00Z'));
    expect(h1).not.toBe(h2);
  });

  it('differs per org on the same day', () => {
    const d = new Date('2026-07-16T09:00:00Z');
    expect(reporterHash(42, 1, d)).not.toBe(reporterHash(42, 2, d));
  });

  it('is a 64-char hex digest (no raw id embedded)', () => {
    const h = reporterHash(42, 1, new Date('2026-07-16T09:00:00Z'));
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain('42');
  });
});

describe('🪜 Consent ladder', () => {
  const on = new Date('2026-07-16T00:00:00Z');
  const dobFor = (age) => new Date(Date.UTC(2026 - age, 6, 1)); // birthday 1 Jul

  it('maps ages to bands', () => {
    expect(ageBandFor(dobFor(10), on)).toBe('under_13');
    expect(ageBandFor(dobFor(14), on)).toBe('13_15');
    expect(ageBandFor(dobFor(16), on)).toBe('16_17');
    expect(ageBandFor(dobFor(18), on)).toBe('18_plus');
  });

  it('under-13 has journal DISABLED and 180-day retention', () => {
    const p = consentPolicy('under_13');
    expect(p.journal_enabled).toBe(false);
    expect(p.pulse).toBe('emoji_only');
    expect(p.retention_days).toBe(180);
  });

  it('13–15 requires BOTH parent consent and student assent', () => {
    const p = consentPolicy('13_15');
    expect(p.parent_consent).toBe('required');
    expect(p.student_assent).toBe('required');
    expect(p.journal_enabled).toBe(true);
  });

  it('16+ does not require parent consent (independent)', () => {
    expect(consentPolicy('16_17').parent_consent).toBe('notified_not_required');
    expect(consentPolicy('18_plus').parent_consent).toBe('not_applicable');
  });

  it('self-raise is available in every band', () => {
    for (const b of ['under_13', '13_15', '16_17', '18_plus']) {
      expect(consentPolicy(b).self_raise).toBe(true);
    }
  });

  it('hasRequiredConsent enforces the band requirements', () => {
    expect(hasRequiredConsent({ parent_consent_at: null, student_assent_at: new Date() }, '13_15')).toBe(false);
    expect(hasRequiredConsent({ parent_consent_at: new Date(), student_assent_at: new Date() }, '13_15')).toBe(true);
    // 18+ needs only the student's own assent
    expect(hasRequiredConsent({ student_assent_at: new Date() }, '18_plus')).toBe(true);
  });

  it('opt-out wins over participates, and reason is optional', () => {
    expect(isParticipating({ participates: 1, opted_out_at: new Date() })).toBe(false);
    const out = buildOptOut();
    expect(out.participates).toBe(0);
    expect(out.opt_out_reason).toBeNull();
    expect(buildOptOut({ reason: 'not today' }).opt_out_reason).toBe('not today');
  });
});

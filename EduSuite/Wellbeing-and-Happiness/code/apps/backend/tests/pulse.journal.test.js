// tests/pulse.journal.test.js — Week 4 (pulse, journal, activities, retention)

process.env.WB_MASTER_KEY = process.env.WB_MASTER_KEY || 'test-master-key-abcdef 0123456789';
process.env.WB_REPORT_SALT = process.env.WB_REPORT_SALT || 'test-report-salt';

const {
  analyzePulsePattern, submitPulse, MOOD_RANK,
} = require('../src/modules/wellbeing/wellbeing.pulse');
const journal = require('../src/modules/wellbeing/wellbeing.journal');
const { anonymizeOldPulses, purgeOldJournal } = require('../src/modules/wellbeing/wellbeing.retention');

// ─── in-memory DB fakes ─────────────────────────────────────────
function pulseDb() {
  const rows = [];
  return {
    rows,
    async query(sql, params) {
      if (/INSERT INTO wb_pulse/i.test(sql)) { rows.push(params); return { insertId: rows.length }; }
      return [];
    },
    async queryOne() { return null; },
  };
}

function journalDb() {
  const journals = new Map();
  const keys = new Map();
  let seq = 0;
  return {
    journals, keys,
    async query(sql, params) {
      if (/INSERT INTO wb_journal_key/i.test(sql)) { keys.set(params[0], params[1]); return []; }
      if (/SELECT key_encrypted FROM wb_journal_key/i.test(sql)) return []; // handled by queryOne
      if (/INSERT INTO wb_journal\b/i.test(sql)) {
        const id = ++seq;
        journals.set(id, {
          id, org_id: params[0], student_id: params[1],
          body_encrypted: params[2], iv: params[3], auth_tag: params[4],
          mood_tag: params[5], shared_with_counsellor: 0, word_count: params[6], deleted_at: null,
        });
        return { insertId: id };
      }
      if (/UPDATE wb_journal SET shared_with_counsellor = 1/i.test(sql)) {
        const id = params[1]; const j = journals.get(id);
        if (j) { j.shared_with_counsellor = 1; return { affectedRows: 1 }; }
        return { affectedRows: 0 };
      }
      if (/DELETE FROM wb_journal WHERE id/i.test(sql)) {
        const id = params[0]; const had = journals.delete(id);
        return { affectedRows: had ? 1 : 0 };
      }
      return [];
    },
    async queryOne(sql, params) {
      if (/SELECT key_encrypted FROM wb_journal_key/i.test(sql)) {
        const k = keys.get(params[0]);
        return k ? { key_encrypted: k } : null;
      }
      if (/FROM wb_journal WHERE id/i.test(sql)) {
        const j = journals.get(params[0]);
        return j && !j.deleted_at && j.org_id === params[1] ? j : null;
      }
      return null;
    },
  };
}

describe('📊 analyzePulsePattern (pure)', () => {
  const day = (n) => new Date(Date.UTC(2026, 6, n)).toISOString().slice(0, 10);
  const now = new Date('2026-07-16T00:00:00Z');

  it('counts a low streak from the most recent day', () => {
    const p = analyzePulsePattern([
      { date: day(16), mood: 'low', energy_1_5: 2 },
      { date: day(15), mood: 'low', energy_1_5: 2 },
      { date: day(14), mood: 'low', energy_1_5: 3 },
      { date: day(13), mood: 'good', energy_1_5: 4 },
    ], now);
    expect(p.low_streak).toBe(3);
    expect(p.struggling_streak).toBe(0);
  });

  it('detects a sudden drop (good → struggling)', () => {
    const p = analyzePulsePattern([
      { date: day(16), mood: 'struggling' },
      { date: day(15), mood: 'good' },
    ], now);
    expect(p.sudden_drop).toBe(true);
  });

  it('flags going quiet after being regular', () => {
    const p = analyzePulsePattern([
      { date: day(1), mood: 'okay' }, { date: day(2), mood: 'okay' },
      { date: day(3), mood: 'okay' }, { date: day(4), mood: 'okay' },
      { date: day(5), mood: 'okay' },
    ], now); // last check-in 11 days ago
    expect(p.stopped_checking_in).toBe(true);
    expect(p.was_regular).toBe(true);
  });
});

describe('🚪 submitPulse — opted-out student produces ZERO rows', () => {
  it('writes nothing when the student has opted out', async () => {
    const db = pulseDb();
    const out = await submitPulse(
      { org_id: 1, student_id: 42, mood: 'low' },
      { getConsent: async () => ({ participates: 0, opted_out_at: new Date() }) },
      db
    );
    expect(out.skipped).toBe(true);
    expect(db.rows).toHaveLength(0);
  });

  it('writes a row for a participating student', async () => {
    const db = pulseDb();
    const out = await submitPulse(
      { org_id: 1, student_id: 42, mood: 'good', energy_1_5: 4 },
      { getConsent: async () => ({ participates: 1 }) },
      db
    );
    expect(out.skipped).toBe(false);
    expect(db.rows).toHaveLength(1);
  });

  it('scans the note and fires the crisis path on a keyword', async () => {
    const db = pulseDb();
    const scan = jest.fn(async () => ({ show_support_screen: true, level: 'immediate' }));
    const out = await submitPulse(
      { org_id: 1, student_id: 42, mood: 'struggling', note: 'i want to die' },
      { getConsent: async () => ({ participates: 1 }), scanForCrisis: scan },
      db
    );
    expect(scan).toHaveBeenCalledTimes(1);
    expect(out.crisis.show_support_screen).toBe(true);
    expect(db.rows).toHaveLength(1); // pulse is still recorded
  });

  it('rejects an invalid mood', async () => {
    await expect(
      submitPulse({ org_id: 1, student_id: 42, mood: 'ecstatic' },
        { getConsent: async () => ({ participates: 1 }) }, pulseDb())
    ).rejects.toThrow(/Invalid mood/);
  });
});

describe('📔 journal lifecycle', () => {
  it('create → read(owner) round-trips through encryption', async () => {
    const db = journalDb();
    const { id } = await journal.createEntry(
      { org_id: 1, student_id: 7, body: 'aaj mann bhaari tha' },
      { getConsent: async () => ({ participates: 1, age_band: '13_15' }) }, db
    );
    const out = await journal.readEntry({ id, org_id: 1, actor_id: 7, actor_role: 'student' }, db);
    expect(out.body).toBe('aaj mann bhaari tha');
  });

  it('a counsellor from a different org cannot read a shared entry, even by id (404 not 403)', async () => {
    const db = journalDb();
    const { id } = await journal.createEntry(
      { org_id: 1, student_id: 7, body: 'please help' },
      { getConsent: async () => ({ participates: 1, age_band: '13_15' }) }, db
    );
    await journal.shareEntry({ id, org_id: 1, student_id: 7 }, db);
    await expect(journal.readEntry(
      { id, org_id: 2, actor_id: 99, actor_role: 'counsellor', reason: 'reviewing shared entry' }, db
    )).rejects.toThrow(/not found/i);
  });

  it('under-13 cannot create a journal entry', async () => {
    const db = journalDb();
    await expect(
      journal.createEntry(
        { org_id: 1, student_id: 7, body: 'hi', age_band: 'under_13' },
        { getConsent: async () => ({ participates: 1, age_band: 'under_13' }) }, db
      )
    ).rejects.toThrow(/not available/i);
  });

  it('share then a counsellor can read with a reason; hard delete removes it', async () => {
    const db = journalDb();
    const audit = jest.fn();
    const { id } = await journal.createEntry(
      { org_id: 1, student_id: 7, body: 'please help' },
      { getConsent: async () => ({ participates: 1, age_band: '13_15' }) }, db
    );
    await journal.shareEntry({ id, org_id: 1, student_id: 7 }, db);
    const read = await journal.readEntry(
      { id, org_id: 1, actor_id: 99, actor_role: 'counsellor', reason: 'reviewing shared entry', auditRead: audit }, db
    );
    expect(read.body).toBe('please help');
    expect(audit).toHaveBeenCalledTimes(1);

    await journal.deleteEntry({ id, org_id: 1, student_id: 7 }, db);
    await expect(journal.readEntry({ id, org_id: 1, actor_id: 7, actor_role: 'student' }, db))
      .rejects.toThrow(/not found/i);
  });

  it('an opted-out student creates no journal row', async () => {
    const db = journalDb();
    const out = await journal.createEntry(
      { org_id: 1, student_id: 7, body: 'x' },
      { getConsent: async () => ({ participates: 0, opted_out_at: new Date() }) }, db
    );
    expect(out.skipped).toBe(true);
    expect(db.journals.size).toBe(0);
  });
});

describe('🧹 retention', () => {
  it('anonymize issues an UPDATE nulling student_id past the window', async () => {
    let captured;
    const db = { async query(sql, params) { captured = { sql, params }; return { affectedRows: 3 }; } };
    const r = await anonymizeOldPulses({ retentionDays: 365 }, db);
    expect(r.anonymized).toBe(3);
    expect(captured.sql).toMatch(/SET student_id = NULL/i);
    expect(captured.params).toEqual([365]);
  });

  it('journal purge issues a DELETE past the window', async () => {
    let captured;
    const db = { async query(sql, params) { captured = { sql, params }; return { affectedRows: 2 }; } };
    const r = await purgeOldJournal({ retentionDays: 730 }, db);
    expect(r.purged).toBe(2);
    expect(captured.sql).toMatch(/DELETE FROM wb_journal/i);
  });
});

describe('sanity', () => {
  it('mood rank orders great highest, struggling lowest', () => {
    expect(MOOD_RANK.great).toBeGreaterThan(MOOD_RANK.struggling);
  });
});

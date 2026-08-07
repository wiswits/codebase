// tests/counsellor.test.js — Week 6 (counsellor desk)

process.env.WB_MASTER_KEY = process.env.WB_MASTER_KEY || 'test-master-key-abcdef 0123456789';

const cases = require('../src/modules/wellbeing/wellbeing.cases');
const { getStudentContext, WHAT_YOU_CANNOT_SEE } = require('../src/modules/wellbeing/wellbeing.context');
const { classMood } = require('../src/modules/wellbeing/wellbeing.aggregate');
const { Forbidden, BadRequest } = require('../src/modules/wellbeing/wellbeing.errors');

// A fake db that records audit inserts and serves canned reads.
function ctxDb({ pulseStudents = 8 } = {}) {
  const audits = [];
  return {
    audits,
    async query(sql, params) {
      if (/INSERT INTO wb_access_audit/i.test(sql)) { audits.push(params); return { insertId: 1 }; }
      if (/FROM wb_pulse WHERE org_id = \? AND student_id = \? AND date/i.test(sql)) return [];
      if (/FROM wb_signal/i.test(sql)) return [];
      if (/FROM wb_case WHERE org_id = \? AND student_id/i.test(sql)) return [];
      return [];
    },
    async queryOne(sql) {
      if (/FROM wb_flag/i.test(sql)) return { id: 1, severity: 'red', score: 72, primary_driver: 'pulse_low_5days' };
      if (/COUNT\(\*\) AS total/i.test(sql)) return { total: 8, shared: 0 };
      return null;
    },
  };
}

describe('🔒 Context view — role + reason gate + audit (the big one)', () => {
  const base = { org_id: 1, actor_id: 99, student_id: 42 };

  it('a teacher cannot open the context view (Forbidden)', async () => {
    await expect(getStudentContext({ ...base, actor_role: 'teacher', reason: 'i am worried about them' }, ctxDb()))
      .rejects.toThrow(Forbidden);
  });

  it('a principal cannot open the context view (Forbidden)', async () => {
    await expect(getStudentContext({ ...base, actor_role: 'principal', reason: 'reviewing the case now' }, ctxDb()))
      .rejects.toThrow(Forbidden);
  });

  it('a counsellor WITHOUT a reason is rejected (BadRequest)', async () => {
    await expect(getStudentContext({ ...base, actor_role: 'counsellor', reason: '' }, ctxDb()))
      .rejects.toThrow(BadRequest);
    await expect(getStudentContext({ ...base, actor_role: 'counsellor', reason: 'short' }, ctxDb()))
      .rejects.toThrow(BadRequest);
  });

  it('a counsellor WITH a reason gets context AND writes exactly one audit row', async () => {
    const db = ctxDb();
    const out = await getStudentContext(
      { ...base, actor_role: 'counsellor', reason: 'Red flag 15 Jul, first contact prep' }, db
    );
    expect(db.audits).toHaveLength(1);
    expect(out.viewing_logged).toBe(true);
    expect(out.journal.locked).toBe(true);          // 0 shared → locked
    expect(out.what_you_cannot_see).toEqual(WHAT_YOU_CANNOT_SEE);
    expect(out.flag.severity).toBe('red');
  });
});

describe('🔐 Session notes — encrypted, decrypt round-trips', () => {
  // Minimal note DB with a per-org key store.
  function noteDb() {
    const notes = new Map(); const keys = new Map(); let seq = 0;
    return {
      notes,
      async query(sql, params) {
        if (/INSERT INTO wb_note_key/i.test(sql)) { keys.set(params[0], params[1]); return []; }
        if (/INSERT INTO wb_session_note/i.test(sql)) {
          const id = ++seq;
          notes.set(id, { id, org_id: params[0], case_id: params[1], body_encrypted: params[2],
                          iv: params[3], auth_tag: params[4], session_type: params[5],
                          duration_min: params[6], counsellor_id: params[7], at: new Date() });
          return { insertId: id };
        }
        if (/SELECT id, body_encrypted/i.test(sql)) {
          return [...notes.values()].filter((n) => n.case_id === params[1]);
        }
        return [];
      },
      async queryOne(sql, params) {
        if (/SELECT key_encrypted FROM wb_note_key/i.test(sql)) {
          const k = keys.get(params[0]); return k ? { key_encrypted: k } : null;
        }
        return null;
      },
    };
  }

  it('addNote encrypts; listNotes decrypts; ciphertext has no plaintext', async () => {
    const db = noteDb();
    await cases.addNote({ org_id: 1, case_id: 5, counsellor_id: 99,
                          body: 'SESSION_SECRET_TEXT: he mentioned trouble sleeping', session_type: 'in_person' }, db);
    const stored = [...db.notes.values()][0];
    expect(stored.body_encrypted.toString('latin1')).not.toMatch(/SESSION_SECRET_TEXT/);
    const list = await cases.listNotes({ org_id: 1, case_id: 5 }, db);
    expect(list[0].body).toMatch(/SESSION_SECRET_TEXT/);
  });
});

describe('👨‍👩‍👧 Parent loop-in — reason mandatory, logged', () => {
  it('rejects an empty reason', async () => {
    const db = { async query() { return {}; } };
    await expect(cases.loopInParent({ org_id: 1, case_id: 5, reason: '' }, db)).rejects.toThrow(BadRequest);
  });

  it('records the reason + child response on the case', async () => {
    let captured;
    const db = { async query(sql, params) { captured = { sql, params }; return {}; } };
    await cases.loopInParent({ org_id: 1, case_id: 5, child_response: 'agreed', what_to_share: 'general',
                              reason: 'child agreed; home is supportive; needs family awareness' }, db);
    expect(captured.sql).toMatch(/parent_looped_in_at = NOW\(\)/);
    expect(captured.params[0]).toMatch(/agreed/);
    expect(captured.params[0]).toMatch(/family awareness/);
  });
});

describe('🔒 Class mood aggregate — min 5', () => {
  it('fewer than 5 distinct check-ins → insufficient_data, no numbers', async () => {
    const db = {
      async query(sql) {
        if (/FROM wb_student_view/i.test(sql)) return [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
        if (/GROUP BY mood/i.test(sql)) return [{ mood: 'low', n: 2, students: 2, avg_energy: 2 }];
        return [];
      },
      async queryOne(sql) {
        if (/COUNT\(DISTINCT student_id\) AS c/i.test(sql)) return { c: 4 };
        return null;
      },
    };
    const out = await classMood({ org_id: 1, class_no: '12', section: 'C' }, db);
    expect(out.insufficient_data).toBe(true);
    expect(out.mood_distribution).toBeUndefined();
  });

  it('5+ distinct check-ins → distribution returned', async () => {
    const db = {
      async query(sql) {
        if (/FROM wb_student_view/i.test(sql)) return Array.from({ length: 32 }, (_, i) => ({ id: i + 1 }));
        if (/GROUP BY mood/i.test(sql)) return [
          { mood: 'good', n: 12, avg_energy: 4 }, { mood: 'okay', n: 6, avg_energy: 3 },
          { mood: 'low', n: 2, avg_energy: 2 },
        ];
        return [];
      },
      async queryOne(sql) {
        if (/COUNT\(DISTINCT student_id\) AS c/i.test(sql)) return { c: 20 };
        return null;
      },
    };
    const out = await classMood({ org_id: 1, class_no: '10', section: 'A' }, db);
    expect(out.insufficient_data).toBeUndefined();
    expect(out.sample_size).toBe(20);
    expect(out.mood_distribution.good).toBe(12);
  });
});

describe('⏱ case SLA on acknowledge', () => {
  it('marks sla_met true when acknowledged before due time', async () => {
    const future = new Date(Date.now() + 3_600_000);
    const db = {
      async query() { return {}; },
      async queryOne() { return { id: 5, sla_due_at: future, counsellor_id: 99 }; },
    };
    const out = await cases.acknowledge({ org_id: 1, id: 5, counsellor_id: 99 }, db);
    expect(out.sla_met).toBe(true);
  });
});

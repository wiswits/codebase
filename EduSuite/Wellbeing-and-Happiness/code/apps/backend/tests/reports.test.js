// tests/reports.test.js — Week 9 (anonymous reporting + principal board)

process.env.WB_MASTER_KEY = process.env.WB_MASTER_KEY || 'test-master-key-abcdef 0123456789';
process.env.WB_REPORT_SALT = process.env.WB_REPORT_SALT || 'test-report-salt';

const reports = require('../src/modules/wellbeing/wellbeing.reports');
const { BadRequest } = require('../src/modules/wellbeing/wellbeing.errors');

// In-memory report store + per-org note key.
function reportDb() {
  const rows = []; const keys = new Map(); let seq = 0;
  return {
    rows,
    async query(sql, params) {
      if (/INSERT INTO wb_note_key/i.test(sql)) { keys.set(params[0], params[1]); return []; }
      if (/INSERT INTO wb_bullying_report/i.test(sql)) {
        const id = ++seq;
        rows.push({ id,
          org_id: params[0], reporter_hash: params[1], reporter_class_hint: params[2], target_hint: params[3],
          description_encrypted: params[4], iv: params[5], auth_tag: params[6], incident_type: params[7],
          location_hint: params[8], frequency: params[9], follow_up_token: params[10], status: 'new' });
        return { insertId: id };
      }
      if (/SELECT id, incident_type/i.test(sql)) return rows;
      return [];
    },
    async queryOne(sql, params) {
      if (/SELECT key_encrypted FROM wb_note_key/i.test(sql)) {
        const k = keys.get(params[0]); return k ? { key_encrypted: k } : null;
      }
      if (/WHERE follow_up_token/i.test(sql)) {
        const r = rows.find((x) => x.follow_up_token === params[0]);
        return r ? { status: r.status, action_summary: null, created_at: new Date() } : null;
      }
      return null;
    },
  };
}

describe('🕊 Anonymous report — anonymity is enforced', () => {
  it('stores NO raw identity; reporter_hash is null when no student given', async () => {
    const db = reportDb();
    const out = await reports.fileReport({ org_id: 1, incident_type: 'verbal', description: 'name-calling near lockers' }, db);
    expect(out.filed).toBe(true);
    expect(out.follow_up_token).toMatch(/^[0-9a-f]{32}$/);
    const row = db.rows[0];
    expect(row.reporter_hash).toBeNull();
  });

  it('when a student identity IS given, only a non-reversible hash is stored (never the raw id)', async () => {
    const db = reportDb();
    await reports.fileReport({ org_id: 1, student_id: 4242, incident_type: 'cyber', description: 'x' }, db);
    const row = db.rows[0];
    expect(row.reporter_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.reporter_hash).not.toContain('4242');
  });

  it('description is encrypted at rest (no plaintext)', async () => {
    const db = reportDb();
    await reports.fileReport({ org_id: 1, incident_type: 'verbal', description: 'REPORT_SECRET_9x nobody sits with him' }, db);
    const blob = db.rows[0].description_encrypted.toString('latin1');
    expect(blob).not.toMatch(/REPORT_SECRET_9x/);
  });

  it('rejects an unknown incident type', async () => {
    await expect(reports.fileReport({ org_id: 1, incident_type: 'nonsense' }, reportDb()))
      .rejects.toThrow(BadRequest);
  });

  it('status lookup by token returns status without any identity', async () => {
    const db = reportDb();
    const { follow_up_token } = await reports.fileReport({ org_id: 1, incident_type: 'verbal', description: 'x' }, db);
    const status = await reports.reportStatus({ token: follow_up_token }, db);
    expect(status.status).toBe('new');
    expect(status).not.toHaveProperty('reporter_hash');
    expect(status).not.toHaveProperty('student_id');
  });

  it('review queue decrypts descriptions for the counsellor', async () => {
    const db = reportDb();
    await reports.fileReport({ org_id: 1, incident_type: 'verbal', description: 'READABLE_BY_COUNSELLOR' }, db);
    const q = await reports.reviewQueue({ org_id: 1 }, db);
    expect(q[0].description).toMatch(/READABLE_BY_COUNSELLOR/);
  });
});

describe('🏫 the fileReport signature accepts no ip/device/session', () => {
  it('ignores any ip/device fields even if passed (never persisted)', async () => {
    const db = reportDb();
    // Simulate a careless caller — extra fields must not land in the row.
    await reports.fileReport({ org_id: 1, incident_type: 'verbal', description: 'x',
      ip: '1.2.3.4', device_id: 'abc', session: 'sess' }, db);
    const row = db.rows[0];
    expect(JSON.stringify(row)).not.toMatch(/1\.2\.3\.4|device_id|sess/);
  });
});

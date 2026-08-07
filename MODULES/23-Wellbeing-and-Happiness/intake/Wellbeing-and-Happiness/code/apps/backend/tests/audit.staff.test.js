// tests/audit.staff.test.js — Week 10 (audit reports, staff, crisis events)

const auditReports = require('../src/modules/wellbeing/wellbeing.audit.reports');
const staff = require('../src/modules/wellbeing/wellbeing.staff');
const crisisEvents = require('../src/modules/wellbeing/wellbeing.crisis.events');
const { NotFound } = require('../src/modules/wellbeing/wellbeing.errors');

const capturing = () => {
  const calls = [];
  return { calls, async query(sql, params) { calls.push({ sql, params }); return []; }, async queryOne() { return null; } };
};

describe('📇 audit reports read the trail, never content', () => {
  it('auditForStudent filters by subject_type student + id, returns reason not content', async () => {
    const db = capturing();
    await auditReports.auditForStudent({ org_id: 1, student_id: 42 }, db);
    expect(db.calls[0].sql).toMatch(/subject_type = 'student'/);
    expect(db.calls[0].sql).toMatch(/reason/);
    expect(db.calls[0].sql).not.toMatch(/body_encrypted|mood/);
    expect(db.calls[0].params).toEqual([1, 42, 100]);
  });

  it('auditForActor filters by actor_id', async () => {
    const db = capturing();
    await auditReports.auditForActor({ org_id: 1, actor_id: 9 }, db);
    expect(db.calls[0].sql).toMatch(/actor_id = \?/);
    expect(db.calls[0].params).toEqual([1, 9, 100]);
  });

  it('listViolations reads the violation log', async () => {
    const db = capturing();
    await auditReports.listViolations({ org_id: 1 }, db);
    expect(db.calls[0].sql).toMatch(/FROM wb_guardrail_violation/);
  });
});

describe('👩‍🏫 staff well-being — self, and min-5 aggregate', () => {
  it('aggregate with fewer than 5 → insufficient_data', async () => {
    const db = { async query() { return [{ avg_rating: 3, burnout: 1, n: 3 }]; } };
    const out = await staff.staffAggregate({ org_id: 1 }, db);
    expect(out.insufficient_data).toBe(true);
  });
  it('aggregate with 5+ → numbers, no names', async () => {
    const db = { async query() { return [{ avg_rating: 3.4, burnout: 2, n: 8 }]; } };
    const out = await staff.staffAggregate({ org_id: 1 }, db);
    expect(out.sample_size).toBe(8);
    expect(out.avg_rating).toBe(3.4);
    expect(out).not.toHaveProperty('staff_id');
  });
  it('a low self-rating flags burnout on submit', async () => {
    let captured;
    const db = { async query(sql, params) { captured = params; return {}; } };
    await staff.submitStaffCheck({ org_id: 1, staff_id: 5, week_start: '2026-07-13', self_rating_1_5: 2 }, db);
    expect(captured[captured.length - 1]).toBe(1); // burnout_flag
  });
});

describe('🚨 crisis events — respond', () => {
  it('responding to a missing event throws NotFound', async () => {
    const db = { async queryOne() { return null; }, async query() { return {}; } };
    await expect(crisisEvents.respondToCrisis({ org_id: 1, id: 99, responded_by: 9 }, db)).rejects.toThrow(NotFound);
  });
  it('responding marks responded_by and resolution', async () => {
    let captured;
    const db = { async queryOne() { return { id: 5 }; }, async query(sql, params) { captured = { sql, params }; return {}; } };
    const out = await crisisEvents.respondToCrisis({ org_id: 1, id: 5, responded_by: 9, resolved: true, outcome: 'safe' }, db);
    expect(out.responded).toBe(true);
    expect(captured.sql).toMatch(/responded_by = \?/);
  });
});

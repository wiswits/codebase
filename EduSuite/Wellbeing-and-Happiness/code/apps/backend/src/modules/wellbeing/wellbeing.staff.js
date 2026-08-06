// wellbeing.staff.js
//
// Staff well-being (PRD Part 9 — STAFF). Staff data is the staff member's own;
// the principal/HR sees ONLY an aggregate, min 5 — same privacy math as students.

const { wbDb } = require('../../config/db');
const { assertAggregateSize } = require('./wellbeing.guardrails');

async function submitStaffCheck({ org_id, staff_id, week_start, self_rating_1_5, workload_score }, db = wbDb) {
  await db.query(
    `INSERT INTO wb_staff_check (org_id, staff_id, week_start, self_rating_1_5, workload_score, burnout_flag)
     VALUES (?,?,?,?,?, ?)
     ON DUPLICATE KEY UPDATE self_rating_1_5 = VALUES(self_rating_1_5), workload_score = VALUES(workload_score)`,
    [org_id, staff_id, week_start, self_rating_1_5 ?? null, workload_score ?? null,
     self_rating_1_5 != null && self_rating_1_5 <= 2 ? 1 : 0]
  );
  return { saved: true };
}

async function myStaffCheck({ org_id, staff_id }, db = wbDb) {
  return db.query(
    `SELECT week_start, self_rating_1_5, workload_score, burnout_flag
       FROM wb_staff_check WHERE org_id = ? AND staff_id = ? ORDER BY week_start DESC LIMIT 12`,
    [org_id, staff_id]
  );
}

// Aggregate for HR/principal — min 5, no names.
async function staffAggregate({ org_id, week_start }, db = wbDb) {
  const rows = await db.query(
    `SELECT AVG(self_rating_1_5) AS avg_rating, SUM(burnout_flag) AS burnout, COUNT(*) AS n
       FROM wb_staff_check WHERE org_id = ? ${week_start ? 'AND week_start = ?' : ''}`,
    week_start ? [org_id, week_start] : [org_id]
  );
  const n = Number(rows[0]?.n ?? 0);
  const insufficient = assertAggregateSize(n);
  if (insufficient) return insufficient;
  return {
    sample_size: n,
    avg_rating: rows[0].avg_rating != null ? Number(Number(rows[0].avg_rating).toFixed(2)) : null,
    burnout_count: Number(rows[0].burnout ?? 0),
  };
}

module.exports = { submitStaffCheck, myStaffCheck, staffAggregate };

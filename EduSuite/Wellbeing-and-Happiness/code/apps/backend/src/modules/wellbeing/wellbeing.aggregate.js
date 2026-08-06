// wellbeing.aggregate.js
//
// Class / school mood — AGGREGATE ONLY. A teacher never sees an individual.
//
// ⚠️ min 5 (WB_GUARDRAILS.MIN_AGGREGATE_SIZE). Fewer than 5 who checked in →
//    insufficient_data with NO numbers. In a class of 3, "67% are sad" reveals
//    two names — that is the math of privacy, not an opinion.

const { wbDb } = require('../../config/db');
const { assertAggregateSize } = require('./wellbeing.guardrails');

// Mood distribution for a class over the last `days`. Returns either
// { insufficient_data:true, min_required } or the distribution + sample_size.
async function classMood({ org_id, class_no, section, days = 7 }, db = wbDb) {
  const where = ['org_id = ?', 'date >= (CURDATE() - INTERVAL ? DAY)', 'student_id IS NOT NULL'];
  const params = [org_id, days];
  // class/section are matched via the student view join-free approach: pulses
  // don't carry class, so we filter by the roster. To keep Waada-1 isolation we
  // only ever read wb_* + wb_student_view (never client_* academic tables).
  const roster = await db.query(
    `SELECT id FROM wb_student_view WHERE org_id = ? AND class_no = ?
       ${section ? 'AND section = ?' : ''}`,
    section ? [org_id, class_no, section] : [org_id, class_no]
  );
  const ids = roster.map((r) => r.id);
  if (ids.length === 0) return { insufficient_data: true, min_required: 5 };

  const placeholders = ids.map(() => '?').join(',');
  const rows = await db.query(
    `SELECT mood, COUNT(*) AS n, COUNT(DISTINCT student_id) AS students, AVG(energy_1_5) AS avg_energy
       FROM wb_pulse
      WHERE ${where.join(' AND ')} AND student_id IN (${placeholders})
      GROUP BY mood`,
    [...params, ...ids]
  );

  const distinctStudents = await db.queryOne(
    `SELECT COUNT(DISTINCT student_id) AS c FROM wb_pulse
      WHERE ${where.join(' AND ')} AND student_id IN (${placeholders})`,
    [...params, ...ids]
  );
  const sample = Number(distinctStudents?.c ?? 0);

  // ⚠️ THE GUARD.
  const insufficient = assertAggregateSize(sample);
  if (insufficient) return insufficient;

  const distribution = {};
  let energySum = 0, energyCount = 0;
  for (const r of rows) {
    distribution[r.mood] = Number(r.n);
    if (r.avg_energy != null) { energySum += Number(r.avg_energy) * Number(r.n); energyCount += Number(r.n); }
  }
  return {
    class_no, section: section ?? null,
    sample_size: sample,
    mood_distribution: distribution,
    avg_energy: energyCount ? Number((energySum / energyCount).toFixed(2)) : null,
  };
}

module.exports = { classMood };

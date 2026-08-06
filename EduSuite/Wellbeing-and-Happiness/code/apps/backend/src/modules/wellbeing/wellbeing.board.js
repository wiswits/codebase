// wellbeing.board.js
//
// The principal's wellness board (PRD Part 8). NUMBERS, NOT NAMES.
// Principal ko chahiye: "Mera school kaisa hai?" — never "Kaun struggle kar raha hai?"
//
// Everything here is a count or a rate. There is no path from this module to an
// individual student's name, mood, case, journal, or note.

const { wbDb } = require('../../config/db');

async function wellnessBoard({ org_id }, db = wbDb) {
  // Check-in participation (last 7 days) vs roster.
  const roster = await db.queryOne('SELECT COUNT(*) AS c FROM wb_student_view WHERE org_id = ?', [org_id]);
  const checkedIn = await db.queryOne(
    `SELECT COUNT(DISTINCT student_id) AS c FROM wb_pulse
      WHERE org_id = ? AND date >= (CURDATE() - INTERVAL 7 DAY) AND student_id IS NOT NULL`, [org_id]);

  const cases = await db.query(
    `SELECT status, COUNT(*) AS n FROM wb_case WHERE org_id = ? GROUP BY status`, [org_id]);
  const open = cases.filter((c) => !['closed', 'resolved'].includes(c.status)).reduce((a, c) => a + Number(c.n), 0);

  const slaRow = await db.queryOne(
    `SELECT AVG(sla_met = 1) AS rate FROM wb_case WHERE org_id = ? AND sla_met IS NOT NULL`, [org_id]);

  // How cases arrived (source mix) — a healthy system sees many student-raised.
  const bySource = await db.query(
    `SELECT primary_driver AS source, COUNT(*) AS n FROM wb_flag
      WHERE org_id = ? GROUP BY primary_driver ORDER BY n DESC`, [org_id]);

  const rosterCount = Number(roster?.c ?? 0);
  const checkedInCount = Number(checkedIn?.c ?? 0);

  return {
    kpis: {
      check_in_rate: rosterCount ? Math.round((checkedInCount / rosterCount) * 100) : null,
      open_cases: open,
      sla_met_rate: slaRow?.rate != null ? Math.round(Number(slaRow.rate) * 100) : null,
      roster: rosterCount,
    },
    cases_by_status: cases,
    flags_by_source: bySource,
    what_you_cannot_see: [
      "Any student's name", "Any student's mood", "Any case detail",
      "Any journal content", "Any session note",
    ],
  };
}

// Per-class aggregate (counts only; individual moods never exposed).
async function boardByClass({ org_id }, db = wbDb) {
  const classes = await db.query(
    `SELECT class_no, COUNT(*) AS students FROM wb_student_view WHERE org_id = ? GROUP BY class_no ORDER BY class_no`,
    [org_id]);
  return classes.map((c) => ({ class_no: c.class_no, students: Number(c.students) }));
}

module.exports = { wellnessBoard, boardByClass };

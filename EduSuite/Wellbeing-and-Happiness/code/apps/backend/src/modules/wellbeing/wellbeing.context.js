// wellbeing.context.js
//
// The counsellor Context View (PRD Part 7.2). "You're here for him, not his file."
//
// ⚠️ Every access:
//    · counsellor role ONLY (teacher/principal/parent → 403)
//    · a reason (min 10 chars) is MANDATORY (→ 400 without)
//    · the read is written to the append-only audit log, always
//
// What it shows: the current flag + signal breakdown, mood trend (with the note
// that academics alone can't drive red), teacher concerns, a LOCKED journal
// panel (count only, unless shared), an activities summary, case history, and an
// explicit "what you cannot see" block. What it never shows: marks, fees,
// discipline, or unshared journal content.

const { wbDb } = require('../../config/db');
const { assertCanSeeIndividual } = require('./wellbeing.guardrails');
const { auditRead } = require('./wellbeing.audit');

const WHAT_YOU_CANNOT_SEE = Object.freeze([
  'His/her marks or exam results',
  'His/her fee status',
  'Any discipline record',
  'The journal (unless explicitly shared)',
]);

// role/actor from the authenticated context. `reason` is mandatory.
async function getStudentContext({ org_id, actor_id, actor_role, student_id, reason, ip }, db = wbDb) {
  // ⚠️ Gate: role + reason, and audit the read. Throws Forbidden/BadRequest.
  assertCanSeeIndividual(actor_role, actor_id, student_id, reason);
  await auditRead({
    org_id, actor_id, actor_role, subject_type: 'student', subject_id: student_id,
    action: 'view', table_name: 'wb_context', reason, ip,
  }, db);

  // Current flag (most recent open/red).
  const flag = await db.queryOne(
    `SELECT id, severity, score, signals_json, primary_driver, status, opened_at
       FROM wb_flag WHERE org_id = ? AND student_id = ?
      ORDER BY opened_at DESC LIMIT 1`,
    [org_id, student_id]
  );

  // Mood trend (last 14 days).
  const pulses = await db.query(
    `SELECT date, mood, energy_1_5, note, context_tags_json
       FROM wb_pulse WHERE org_id = ? AND student_id = ? AND date >= (CURDATE() - INTERVAL 14 DAY)
      ORDER BY date ASC`,
    [org_id, student_id]
  );

  // Human concerns (teacher/warden/counsellor).
  const concerns = await db.query(
    `SELECT source, detail_json, detected_at FROM wb_signal
      WHERE org_id = ? AND student_id = ?
        AND source IN ('teacher_concern','warden_concern','counsellor_observation','peer_report')
      ORDER BY detected_at DESC`,
    [org_id, student_id]
  );

  // Journal — LOCKED. Count only, plus how many the student chose to share.
  const journalMeta = await db.queryOne(
    `SELECT COUNT(*) AS total, SUM(shared_with_counsellor = 1) AS shared
       FROM wb_journal WHERE org_id = ? AND student_id = ? AND deleted_at IS NULL`,
    [org_id, student_id]
  );

  // Case history.
  const history = await db.query(
    `SELECT id, status, priority, outcome, opened_at, closed_at
       FROM wb_case WHERE org_id = ? AND student_id = ? ORDER BY opened_at DESC`,
    [org_id, student_id]
  );

  return {
    student_id,
    viewing_logged: true,
    reason,
    flag,
    mood: {
      pulses,
      note: 'Attendance and academics alone cannot produce a red flag. Mood streaks ' +
            'and human concern are the real drivers.',
    },
    concerns,
    journal: {
      total: journalMeta?.total ?? 0,
      shared: Number(journalMeta?.shared ?? 0),
      locked: (Number(journalMeta?.shared ?? 0) === 0),
      note: 'Journal entries are private. You can only read those the student has shared.',
    },
    history,
    what_you_cannot_see: WHAT_YOU_CANNOT_SEE,
  };
}

module.exports = { getStudentContext, WHAT_YOU_CANNOT_SEE };

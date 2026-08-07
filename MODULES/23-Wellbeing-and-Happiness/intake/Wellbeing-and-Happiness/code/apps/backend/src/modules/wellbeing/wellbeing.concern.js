// wellbeing.concern.js
//
// "Raise a concern" — the teacher's most valuable contribution, better than any
// algorithm (PRD Part 6.3). A concern becomes a human-observation signal and is
// evaluated into a flag. The counsellor sees it; the teacher does NOT see the
// outcome (that's the child's privacy). The child is never told who reported.

const { wbDb } = require('../../config/db');
const { SIGNAL_WEIGHTS } = require('./wellbeing.signals');
const { BadRequest } = require('./wellbeing.errors');

const URGENCY_TO_SOURCE = {
  // A teacher/warden concern maps to the tier-2 human signal.
};

// role decides the signal source. Returns { received:true } — deliberately no
// outcome, no flag id back to the reporter.
async function raiseConcern({ org_id, actor_id, actor_role, student_id, note, urgency }, deps = {}, db = wbDb) {
  if (!student_id) throw new BadRequest('Which student is this about?');
  if (!note?.trim()) throw new BadRequest('Please describe what you noticed.');

  const source = actor_role === 'counsellor' ? 'counsellor_observation'
               : actor_role === 'warden' ? 'warden_concern'
               : 'teacher_concern';
  const weight = SIGNAL_WEIGHTS[source] ?? 40;

  await db.query(
    `INSERT INTO wb_signal (org_id, student_id, source, signal_type, weight, detail_json, detected_at, expires_at)
     VALUES (?,?,?,?,?,?,NOW(), (NOW() + INTERVAL 21 DAY))`,
    [org_id, student_id, source, 'human_concern', weight,
     JSON.stringify({ by_role: actor_role, urgency: urgency ?? 'this_week', note: note.trim() })]
  );

  // Re-evaluate the student's signals into a flag (self-raise urgency escalates
  // separately). deps.evaluate is injected so this is testable / decoupled.
  if (deps.evaluate) {
    await deps.evaluate({ org_id, student_id });
  }

  // ⚠️ No outcome returned. The reporter is thanked and that is all.
  return { received: true };
}

// A teacher's own list — status only, never the student's data.
async function myConcerns({ org_id, actor_id }, db = wbDb) {
  return db.query(
    `SELECT id, student_id, detected_at,
            JSON_EXTRACT(detail_json,'$.urgency') AS urgency
       FROM wb_signal
      WHERE org_id = ? AND source IN ('teacher_concern','warden_concern')
        AND JSON_EXTRACT(detail_json,'$.by_actor') = ?
      ORDER BY detected_at DESC`,
    [org_id, actor_id]
  );
}

module.exports = { raiseConcern, myConcerns, URGENCY_TO_SOURCE };

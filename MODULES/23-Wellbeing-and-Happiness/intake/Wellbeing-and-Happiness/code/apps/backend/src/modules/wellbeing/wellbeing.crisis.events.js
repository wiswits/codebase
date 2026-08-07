// wellbeing.crisis.events.js
//
// Reading/responding to crisis events (PRD Part 9 — CRISIS). The most sensitive
// table: counsellor + platform_owner only. Trigger detail stays encrypted; the
// list returns metadata + severity, never the decrypted text by default.

const { wbDb } = require('../../config/db');
const { NotFound } = require('./wellbeing.errors');

async function listCrisisEvents({ org_id, resolved }, db = wbDb) {
  return db.query(
    `SELECT id, student_id, trigger_source, severity, consent_overridden,
            responded_at, responded_by, resolved_at, created_at
       FROM wb_crisis_event
      WHERE org_id = ? ${resolved === false ? 'AND resolved_at IS NULL' : ''}
      ORDER BY created_at DESC`,
    [org_id]
  );
}

async function respondToCrisis({ org_id, id, responded_by, actions, outcome, resolved }, db = wbDb) {
  const row = await db.queryOne('SELECT id FROM wb_crisis_event WHERE id = ? AND org_id = ?', [id, org_id]);
  if (!row) throw new NotFound('Crisis event not found.');
  await db.query(
    `UPDATE wb_crisis_event
        SET responded_at = COALESCE(responded_at, NOW()), responded_by = ?,
            actions_taken_json = ?, outcome = ?, resolved_at = ?
      WHERE id = ? AND org_id = ?`,
    [responded_by, actions ? JSON.stringify(actions) : null, outcome ?? null,
     resolved ? new Date() : null, id, org_id]
  );
  return { responded: true };
}

module.exports = { listCrisisEvents, respondToCrisis };

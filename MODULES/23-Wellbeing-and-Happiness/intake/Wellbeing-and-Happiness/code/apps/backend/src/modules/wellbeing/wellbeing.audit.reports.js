// wellbeing.audit.reports.js
//
// Reading the accountability trail (PRD Part 9 — AUDIT). Platform-owner only.
// "Who saw this student's data?" / "What did this person access?"
//
// ⚠️ These are reads OF the audit log, not of student content. They return who,
//    when, why (the logged reason) — never a child's mood/journal/notes.

const { wbDb } = require('../../config/db');

async function listAudit({ org_id, limit = 100 }, db = wbDb) {
  return db.query(
    `SELECT id, actor_id, actor_role, subject_type, subject_id, action, table_name, reason, at
       FROM wb_access_audit WHERE org_id = ? ORDER BY at DESC LIMIT ?`,
    [org_id, Number(limit)]
  );
}

// Who saw THIS student's data.
async function auditForStudent({ org_id, student_id, limit = 100 }, db = wbDb) {
  return db.query(
    `SELECT id, actor_id, actor_role, action, table_name, reason, at
       FROM wb_access_audit WHERE org_id = ? AND subject_type = 'student' AND subject_id = ?
      ORDER BY at DESC LIMIT ?`,
    [org_id, student_id, Number(limit)]
  );
}

// What did THIS actor access.
async function auditForActor({ org_id, actor_id, limit = 100 }, db = wbDb) {
  return db.query(
    `SELECT id, subject_type, subject_id, action, table_name, reason, at
       FROM wb_access_audit WHERE org_id = ? AND actor_id = ?
      ORDER BY at DESC LIMIT ?`,
    [org_id, actor_id, Number(limit)]
  );
}

async function listViolations({ org_id, limit = 100 }, db = wbDb) {
  // org_id may be null for system-level violations; return both scopes.
  return db.query(
    `SELECT id, org_id, actor_id, guardrail, attempted_action, query_hash, blocked_at
       FROM wb_guardrail_violation ORDER BY blocked_at DESC LIMIT ?`,
    [Number(limit)]
  );
}

module.exports = { listAudit, auditForStudent, auditForActor, listViolations };

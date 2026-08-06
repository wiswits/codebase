// wellbeing.audit.js
//
// Every individual data read/action is written here, with a mandatory reason.
// The table is append-only (DB triggers). This module is the ONLY writer.

const crypto = require('crypto');
const { wbDb } = require('../../config/db');
const { WB_GUARDRAILS } = require('./wellbeing.guardrails');
const { BadRequest } = require('./wellbeing.errors');

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(String(ip)).digest('hex');
}

// db is injectable for tests.
async function auditRead(entry, db = wbDb) {
  const {
    org_id, actor_id, actor_role, subject_type, subject_id,
    action = 'view', table_name = null, reason, ip = null,
  } = entry;

  if (!reason || reason.trim().length < WB_GUARDRAILS.MIN_REASON_CHARS) {
    throw new BadRequest(
      `A reason (min ${WB_GUARDRAILS.MIN_REASON_CHARS} chars) is required and must be logged.`
    );
  }

  await db.query(
    `INSERT INTO wb_access_audit
       (org_id, actor_id, actor_role, subject_type, subject_id, action, table_name, reason, ip_hash, at)
     VALUES (?,?,?,?,?,?,?,?,?,NOW())`,
    [org_id, actor_id, actor_role, subject_type, subject_id ?? null, action, table_name,
     reason.trim(), hashIp(ip)]
  );
}

module.exports = { auditRead, hashIp };

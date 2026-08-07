// wellbeing.repo.js
// Thin DB helpers shared across services. All go through wbDb (linted pool).

const { wbDb } = require('../../config/db');
const crypto = require('./wellbeing.crypto');

// ─── consent ────────────────────────────────────────────────────
async function getConsent({ org_id, student_id }, db = wbDb) {
  return db.queryOne(
    'SELECT * FROM wb_consent WHERE org_id = ? AND student_id = ?', [org_id, student_id]
  );
}

async function upsertConsent({ org_id, student_id, age_band, participates, journal_enabled,
                               parent_consent_at, student_assent_at }, db = wbDb) {
  await db.query(
    `INSERT INTO wb_consent
       (org_id, student_id, participates, age_band, parent_consent_at, student_assent_at, journal_enabled, updated_at)
     VALUES (?,?,?,?,?,?,?,NOW())
     ON DUPLICATE KEY UPDATE
       participates = VALUES(participates),
       age_band = VALUES(age_band),
       parent_consent_at = VALUES(parent_consent_at),
       student_assent_at = VALUES(student_assent_at),
       journal_enabled = VALUES(journal_enabled),
       opted_out_at = NULL,
       updated_at = NOW()`,
    [org_id, student_id, participates ? 1 : 0, age_band,
     parent_consent_at ?? null, student_assent_at ?? null, journal_enabled ? 1 : 0]
  );
  return getConsent({ org_id, student_id }, db);
}

// ⚠️ One tap, zero friction, reason optional. Invisible to staff.
async function optOut({ org_id, student_id, reason }, db = wbDb) {
  await db.query(
    `UPDATE wb_consent SET participates = 0, opted_out_at = NOW(), opt_out_reason = ?, updated_at = NOW()
      WHERE org_id = ? AND student_id = ?`,
    [reason?.trim()?.slice(0, 255) || null, org_id, student_id]
  );
  return { opted_out: true };
}

// ─── crisis-path writers (used by the crisis responder) ─────────
async function createCrisisEvent(e, db = wbDb) {
  // Encrypt the trigger detail with the student's journal key (most sensitive text).
  let enc = { body_encrypted: null, iv: null, auth_tag: null };
  if (e.trigger_detail) {
    enc = await crypto.encryptJournal({ student_id: e.student_id, plaintext: e.trigger_detail }, db);
  }
  const res = await db.query(
    `INSERT INTO wb_crisis_event
       (org_id, student_id, trigger_source, trigger_detail_encrypted, iv, auth_tag, severity,
        consent_overridden, override_reason, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,NOW())`,
    [e.org_id, e.student_id, e.trigger_source || 'keyword',
     enc.body_encrypted, enc.iv, enc.auth_tag, e.severity,
     e.consent_overridden ? 1 : 0, e.override_reason ?? null]
  );
  return { id: res.insertId };
}

async function createFlag(f, db = wbDb) {
  const res = await db.query(
    `INSERT INTO wb_flag (org_id, student_id, severity, score, signals_json, primary_driver, status, opened_at)
     VALUES (?,?,?,?,?,?, 'open', NOW())`,
    [f.org_id, f.student_id, f.severity, f.score,
     f.signals_json ? JSON.stringify(f.signals_json) : null, f.primary_driver ?? null]
  );
  return { id: res.insertId };
}

async function createCase(c, db = wbDb) {
  const res = await db.query(
    `INSERT INTO wb_case (org_id, student_id, flag_id, status, priority, opened_at, sla_due_at)
     VALUES (?,?,?, 'new', ?, NOW(), ?)`,
    [c.org_id, c.student_id, c.flag_id ?? null, c.priority || 'routine', c.sla_due_at ?? null]
  );
  return { id: res.insertId };
}

module.exports = {
  getConsent, upsertConsent, optOut,
  createCrisisEvent, createFlag, createCase,
};

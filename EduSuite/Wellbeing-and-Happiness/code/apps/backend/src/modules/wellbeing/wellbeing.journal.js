// wellbeing.journal.js
//
// The journal service. "Meri diary meri hai" — my diary is mine:
//   · Entries are AES-256-GCM encrypted per student (Week 2 crypto).
//   · Only the author reads them; hard delete is allowed HERE (and only here).
//   · The student may explicitly share an entry with a counsellor — reversible.
//   · Sharing an entry with a counsellor is a self-raise-adjacent signal
//     (Week 5 consumes `shared_with_counsellor`).

const { wbDb } = require('../../config/db');
const crypto = require('./wellbeing.crypto');
const { isParticipating, consentPolicy } = require('./wellbeing.consent');
const { Forbidden, NotFound } = require('./wellbeing.errors');

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// deps: { getConsent }. db injectable. Returns the new entry id.
async function createEntry({ org_id, student_id, body, mood_tag, age_band },
                           deps = {}, db = wbDb) {
  const { getConsent } = deps;
  const consent = getConsent ? await getConsent({ org_id, student_id }) : null;
  if (!isParticipating(consent)) return { skipped: true };

  // Journal is disabled for the youngest band (too young for a private space).
  const band = age_band || consent?.age_band;
  if (band && consentPolicy(band).journal_enabled === false) {
    throw new Forbidden('Journal is not available for this age.');
  }

  const enc = await crypto.encryptJournal({ student_id, plaintext: body }, db);
  const rows = await db.query(
    `INSERT INTO wb_journal
       (org_id, student_id, body_encrypted, iv, auth_tag, mood_tag, shared_with_counsellor, word_count, created_at, updated_at)
     VALUES (?,?,?,?,?,?,0,?,NOW(),NOW())`,
    [org_id, student_id, enc.body_encrypted, enc.iv, enc.auth_tag, mood_tag ?? null, wordCount(body)]
  );
  return { skipped: false, id: rows.insertId };
}

// List metadata only — never decrypts in a list (the student opens one at a time).
async function listMine({ org_id, student_id }, db = wbDb) {
  return db.query(
    `SELECT id, mood_tag, shared_with_counsellor, word_count, created_at, updated_at
       FROM wb_journal
      WHERE org_id = ? AND student_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC`,
    [org_id, student_id]
  );
}

// Read one entry, decrypted. Access is enforced by crypto.decryptJournal:
// only the owner, or a counsellor IF the entry was shared (with reason+audit).
// org_id comes from the caller's own auth context (req.wb.org_id), never from
// the row itself — otherwise a counsellor could enumerate another org's
// shared entries by id. A mismatch reads as NotFound, not Forbidden, so it
// doesn't even confirm the entry exists.
async function readEntry({ id, org_id, actor_id, actor_role, reason, auditRead }, db = wbDb) {
  const row = await db.queryOne(
    `SELECT id, org_id, student_id, body_encrypted, iv, auth_tag, shared_with_counsellor
       FROM wb_journal WHERE id = ? AND org_id = ? AND deleted_at IS NULL`, [id, org_id]
  );
  if (!row) throw new NotFound('Journal entry not found.');
  const body = await crypto.decryptJournal({ row, actor_id, actor_role, reason, auditRead }, db);
  return { id: row.id, body, shared_with_counsellor: !!row.shared_with_counsellor };
}

// Student shares an entry with a counsellor. Explicit, reversible, their choice.
async function shareEntry({ id, org_id, student_id, case_id = null }, db = wbDb) {
  const res = await db.query(
    `UPDATE wb_journal SET shared_with_counsellor = 1, shared_at = NOW(), shared_case_id = ?
      WHERE id = ? AND org_id = ? AND student_id = ? AND deleted_at IS NULL`,
    [case_id, id, org_id, student_id]
  );
  if (!res.affectedRows) throw new NotFound('Journal entry not found.');
  return { shared: true };
}

async function unshareEntry({ id, org_id, student_id }, db = wbDb) {
  await db.query(
    `UPDATE wb_journal SET shared_with_counsellor = 0, shared_at = NULL, shared_case_id = NULL
      WHERE id = ? AND org_id = ? AND student_id = ? AND deleted_at IS NULL`,
    [id, org_id, student_id]
  );
  return { shared: false };
}

// ⚠️ HARD delete — allowed only here. "Meri diary" means I can erase it.
async function deleteEntry({ id, org_id, student_id }, db = wbDb) {
  const res = await db.query(
    `DELETE FROM wb_journal WHERE id = ? AND org_id = ? AND student_id = ?`,
    [id, org_id, student_id]
  );
  if (!res.affectedRows) throw new NotFound('Journal entry not found.');
  return { deleted: true };
}

module.exports = {
  wordCount, createEntry, listMine, readEntry, shareEntry, unshareEntry, deleteEntry,
};

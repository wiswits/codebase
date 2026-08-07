// wellbeing.reports.js
//
// Anonymous bullying / safety reporting (PRD Part 3 + Part 9).
//
// ⚠️ Anonymous ka matlab anonymous. We store NO ip, NO user_agent, NO device_id,
//    NO session link. If a logged-in student chooses to report, we keep only a
//    daily-rotating, non-reversible reporter_hash (so the same person on the
//    same day can be de-duped, but never traced across days). The description is
//    encrypted. This is deliberate — a feature, not a gap.

const crypto = require('crypto');
const { wbDb } = require('../../config/db');
const wbcrypto = require('./wellbeing.crypto');
const { BadRequest, NotFound } = require('./wellbeing.errors');

const INCIDENT_TYPES = ['verbal', 'physical', 'social_exclusion', 'cyber', 'extortion', 'discrimination', 'other'];

// Create a report. `student_id`/`org_id` are OPTIONAL — the endpoint is usable
// with no login at all. We NEVER accept or store ip/device/user-agent here.
async function fileReport({ org_id, student_id, incident_type, description,
                            reporter_class_hint, target_hint, location_hint, frequency }, db = wbDb) {
  if (!org_id) throw new BadRequest('An org is required to route the report.');
  if (!INCIDENT_TYPES.includes(incident_type)) throw new BadRequest('Unknown incident type.');

  // Non-reversible, daily-rotating reporter hash — only if a student identity was
  // supplied. Otherwise null (fully anonymous). Never the raw id.
  const reporter_hash = student_id ? wbcrypto.reporterHash(student_id, org_id) : null;

  // Encrypt the description with the org's counsellor key (reviewer can read it).
  let enc = { body_encrypted: null, iv: null, auth_tag: null };
  if (description?.trim()) enc = await wbcrypto.encryptNote({ org_id, plaintext: description.trim() }, db);

  // A follow-up token the reporter can keep to check status — unlinked to identity.
  const follow_up_token = crypto.randomBytes(16).toString('hex');

  await db.query(
    `INSERT INTO wb_bullying_report
       (org_id, reporter_hash, reporter_class_hint, target_hint, description_encrypted, iv, auth_tag,
        incident_type, location_hint, frequency, status, follow_up_token, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?, 'new', ?, NOW())`,
    [org_id, reporter_hash, reporter_class_hint ?? null, target_hint ?? null,
     enc.body_encrypted, enc.iv, enc.auth_tag, incident_type,
     location_hint ?? null, frequency ?? null, follow_up_token]
  );

  // ⚠️ Return only the token + a reassuring status. Nothing identifying.
  return { filed: true, follow_up_token, status: 'new' };
}

// Reporter checks status with their token — no identity needed, no data leaked.
async function reportStatus({ token }, db = wbDb) {
  const row = await db.queryOne(
    `SELECT status, action_summary, created_at FROM wb_bullying_report WHERE follow_up_token = ?`, [token]
  );
  if (!row) throw new NotFound('No report found for that token.');
  return { status: row.status, action_summary: row.action_summary ?? null, created_at: row.created_at };
}

// Counsellor review queue — decrypts descriptions for the reviewer.
async function reviewQueue({ org_id, status }, db = wbDb) {
  const rows = await db.query(
    `SELECT id, incident_type, reporter_class_hint, target_hint, location_hint, frequency,
            status, description_encrypted, iv, auth_tag, created_at
       FROM wb_bullying_report WHERE org_id = ? ${status ? 'AND status = ?' : ''}
      ORDER BY created_at DESC`,
    status ? [org_id, status] : [org_id]
  );
  const out = [];
  for (const r of rows) {
    let description = null;
    if (r.description_encrypted) {
      // decryptNote expects { body_encrypted, iv, auth_tag }; map from the report's column name.
      const cryptoRow = { body_encrypted: r.description_encrypted, iv: r.iv, auth_tag: r.auth_tag };
      try { description = await wbcrypto.decryptNote({ org_id, row: cryptoRow }, db); } catch { description = '[unreadable]'; }
    }
    out.push({
      id: r.id, incident_type: r.incident_type, reporter_class_hint: r.reporter_class_hint,
      target_hint: r.target_hint, location_hint: r.location_hint, frequency: r.frequency,
      status: r.status, description, created_at: r.created_at,
    });
  }
  return out;
}

async function updateReport({ org_id, id, status, action_summary, assigned_to }, db = wbDb) {
  const sets = [], params = [];
  if (status) { sets.push('status = ?'); params.push(status); }
  if (action_summary != null) { sets.push('action_summary = ?'); params.push(action_summary); }
  if (assigned_to != null) { sets.push('assigned_to = ?'); params.push(assigned_to); }
  if (!sets.length) throw new BadRequest('Nothing to update.');
  sets.push('reviewed_at = NOW()');
  params.push(id, org_id);
  await db.query(`UPDATE wb_bullying_report SET ${sets.join(', ')} WHERE id = ? AND org_id = ?`, params);
  return { updated: true };
}

// Aggregate stats for the principal — counts only, no content.
async function reportStats({ org_id }, db = wbDb) {
  const byType = await db.query(
    `SELECT incident_type, COUNT(*) AS n FROM wb_bullying_report WHERE org_id = ? GROUP BY incident_type`, [org_id]);
  const byStatus = await db.query(
    `SELECT status, COUNT(*) AS n FROM wb_bullying_report WHERE org_id = ? GROUP BY status`, [org_id]);
  return { by_type: byType, by_status: byStatus };
}

module.exports = { INCIDENT_TYPES, fileReport, reportStatus, reviewQueue, updateReport, reportStats };

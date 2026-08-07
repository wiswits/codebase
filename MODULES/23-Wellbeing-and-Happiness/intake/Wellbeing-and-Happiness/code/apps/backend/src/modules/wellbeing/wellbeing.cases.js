// wellbeing.cases.js
//
// The counsellor's caseload. Cases carry an SLA; notes are encrypted and
// counsellor-only; referrals and parent loop-ins are logged with a reason.
//
// ⚠️ Session notes: AES-256-GCM, counsellor key. Principal nahi. AK Sir nahi.
//    DBA nahi. Only the counsellor role reads them.

const { wbDb } = require('../../config/db');
const crypto = require('./wellbeing.crypto');
const { BadRequest, NotFound } = require('./wellbeing.errors');
const { WB_GUARDRAILS } = require('./wellbeing.guardrails');

const addHours = (d, h) => new Date(d.getTime() + h * 3_600_000);

// ─── queue ──────────────────────────────────────────────────────
// Priority-sorted, SLA-aware. No ranking of students — this is a work queue of
// cases the counsellor owns, not a leaderboard.
async function listQueue({ org_id, status, priority }, db = wbDb) {
  const where = ['org_id = ?'];
  const params = [org_id];
  if (status) { where.push('status = ?'); params.push(status); }
  if (priority) { where.push('priority = ?'); params.push(priority); }
  return db.query(
    `SELECT id, student_id, flag_id, counsellor_id, status, priority,
            opened_at, sla_due_at, first_contact_at, sla_met
       FROM wb_case
      WHERE ${where.join(' AND ')}
      ORDER BY FIELD(priority,'crisis','urgent','soon','routine'), sla_due_at ASC`,
    params
  );
}

async function getCase({ org_id, id }, db = wbDb) {
  const row = await db.queryOne('SELECT * FROM wb_case WHERE id = ? AND org_id = ?', [id, org_id]);
  if (!row) throw new NotFound('Case not found.');
  return row;
}

async function createCase({ org_id, student_id, flag_id, priority = 'routine', counsellor_id }, db = wbDb) {
  const slaHours = priority === 'crisis' ? 0.25 : priority === 'urgent' ? 2 : WB_GUARDRAILS.RED_FLAG_SLA_HOURS;
  const res = await db.query(
    `INSERT INTO wb_case (org_id, student_id, flag_id, counsellor_id, status, priority, opened_at, sla_due_at)
     VALUES (?,?,?,?, 'new', ?, NOW(), ?)`,
    [org_id, student_id, flag_id ?? null, counsellor_id ?? null, priority, addHours(new Date(), slaHours)]
  );
  return { id: res.insertId };
}

// First contact stops the SLA clock. sla_met is computed against the due time.
async function acknowledge({ org_id, id, counsellor_id }, db = wbDb) {
  const c = await getCase({ org_id, id }, db);
  const met = c.sla_due_at ? new Date() <= new Date(c.sla_due_at) ? 1 : 0 : null;
  await db.query(
    `UPDATE wb_case SET status = 'contacted', counsellor_id = ?, first_contact_at = NOW(), sla_met = ?
      WHERE id = ? AND org_id = ?`,
    [counsellor_id ?? c.counsellor_id, met, id, org_id]
  );
  return { acknowledged: true, sla_met: met === 1 };
}

async function patchCase({ org_id, id, status, priority, counsellor_id, followup_at }, db = wbDb) {
  const sets = [], params = [];
  if (status) { sets.push('status = ?'); params.push(status); }
  if (priority) { sets.push('priority = ?'); params.push(priority); }
  if (counsellor_id != null) { sets.push('counsellor_id = ?'); params.push(counsellor_id); }
  if (followup_at) { sets.push('followup_at = ?'); params.push(followup_at); }
  if (!sets.length) throw new BadRequest('Nothing to update.');
  params.push(id, org_id);
  await db.query(`UPDATE wb_case SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ? AND org_id = ?`, params);
  return getCase({ org_id, id }, db);
}

async function closeCase({ org_id, id, outcome, followup_at }, db = wbDb) {
  await db.query(
    `UPDATE wb_case SET status = 'closed', outcome = ?, closed_at = NOW(), followup_at = ?
      WHERE id = ? AND org_id = ?`,
    [outcome ?? 'no_action_needed', followup_at ?? null, id, org_id]
  );
  return { closed: true };
}

// ─── encrypted session notes (counsellor only) ──────────────────
async function addNote({ org_id, case_id, counsellor_id, body, session_type = 'note', duration_min }, db = wbDb) {
  if (!body?.trim()) throw new BadRequest('A note body is required.');
  const enc = await crypto.encryptNote({ org_id, plaintext: body }, db);
  const res = await db.query(
    `INSERT INTO wb_session_note (org_id, case_id, body_encrypted, iv, auth_tag, session_type, duration_min, counsellor_id, at)
     VALUES (?,?,?,?,?,?,?,?,NOW())`,
    [org_id, case_id, enc.body_encrypted, enc.iv, enc.auth_tag, session_type, duration_min ?? null, counsellor_id]
  );
  return { id: res.insertId };
}

// ⚠️ Read notes — this returns decrypted text and MUST only be reachable by the
//    counsellor role (enforced at the route). Every read is audited by caller.
async function listNotes({ org_id, case_id }, db = wbDb) {
  const rows = await db.query(
    `SELECT id, body_encrypted, iv, auth_tag, session_type, duration_min, counsellor_id, at
       FROM wb_session_note WHERE org_id = ? AND case_id = ? ORDER BY at DESC`,
    [org_id, case_id]
  );
  const out = [];
  for (const r of rows) {
    out.push({
      id: r.id, session_type: r.session_type, duration_min: r.duration_min,
      counsellor_id: r.counsellor_id, at: r.at,
      body: await crypto.decryptNote({ org_id, row: r }, db),
    });
  }
  return out;
}

// ─── referral ───────────────────────────────────────────────────
async function refer({ org_id, case_id, student_id, referred_to, provider_name, provider_contact, reason }, db = wbDb) {
  let enc = { body_encrypted: null, iv: null, auth_tag: null };
  if (reason) enc = await crypto.encryptNote({ org_id, plaintext: reason }, db);
  const res = await db.query(
    `INSERT INTO wb_referral (org_id, case_id, student_id, referred_to, provider_name, provider_contact, reason_encrypted, referred_at)
     VALUES (?,?,?,?,?,?,?,NOW())`,
    [org_id, case_id, student_id, referred_to, provider_name ?? null, provider_contact ?? null, enc.body_encrypted]
  );
  await db.query(`UPDATE wb_case SET status = 'referred' WHERE id = ? AND org_id = ?`, [case_id, org_id]);
  return { id: res.insertId };
}

// ─── parent loop-in — the hardest decision (logged, reason mandatory) ──
// ⚠️ Never shares mood data, journal, or session notes — chahe kuch bhi ho.
async function loopInParent({ org_id, case_id, counsellor_id, child_response, reason, what_to_share }, db = wbDb) {
  if (!reason || reason.trim().length < WB_GUARDRAILS.MIN_REASON_CHARS) {
    throw new BadRequest('A written reason is required to loop in a parent.');
  }
  await db.query(
    `UPDATE wb_case SET parent_looped_in_at = NOW(), parent_loop_reason = ? WHERE id = ? AND org_id = ?`,
    [`[${child_response || 'n/a'}] ${reason.trim()} (share: ${what_to_share || 'general'})`, case_id, org_id]
  );
  return { looped_in: true };
}

module.exports = {
  listQueue, getCase, createCase, acknowledge, patchCase, closeCase,
  addNote, listNotes, refer, loopInParent,
};

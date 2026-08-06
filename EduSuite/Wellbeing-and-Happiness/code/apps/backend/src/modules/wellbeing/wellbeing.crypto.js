// wellbeing.crypto.js
//
// ⚠️ Journal = bachche ka sabse private space.
//    The journal is the child's most private space. If it leaks, the module's
//    trust is gone. And once trust is gone, children lie. And no child is saved
//    by false data.
//
// Design:
//   · Per-student data-encryption-key (DEK), wrapped at rest by the KMS master.
//   · AES-256-GCM (authenticated) for every entry.
//   · Keys are zeroed in memory immediately after use.
//   · decryptJournal enforces the access promise: only the student, unless
//     they have EXPLICITLY shared the entry with a counsellor.

const crypto = require('crypto');
const kms = require('./wellbeing.kms');
const { wbDb } = require('../../config/db');
const { WB_GUARDRAILS } = require('./wellbeing.guardrails');
const { BadRequest, Forbidden } = require('./wellbeing.errors');

const ALGO = 'aes-256-gcm';

// ─── Pure primitives (no DB) — the testable core ────────────────
function aesEncrypt(key, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { body_encrypted: ct, iv, auth_tag: tag };
}

function aesDecrypt(key, { body_encrypted, iv, auth_tag }) {
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(auth_tag);
  return Buffer.concat([decipher.update(body_encrypted), decipher.final()]).toString('utf8');
}

// ─── Per-student key, wrapped with the KMS master ───────────────
// `db` is injectable so this is unit-testable without a live MySQL.
async function getStudentKey(student_id, db = wbDb) {
  const row = await db.queryOne(
    'SELECT key_encrypted FROM wb_journal_key WHERE student_id = ?', [student_id]
  );
  if (!row) {
    const dek = crypto.randomBytes(32);
    const wrapped = kms.wrap(dek);
    await db.query(
      'INSERT INTO wb_journal_key (student_id, key_encrypted, created_at) VALUES (?,?,NOW())',
      [student_id, wrapped]
    );
    return dek;
  }
  return kms.unwrap(row.key_encrypted);
}

async function encryptJournal({ student_id, plaintext }, db = wbDb) {
  const key = await getStudentKey(student_id, db);
  try {
    return aesEncrypt(key, plaintext);
  } finally {
    key.fill(0); // ⚠️ zero the key in memory
  }
}

// row: { id, org_id, student_id, body_encrypted, iv, auth_tag, shared_with_counsellor }
// auditRead is injected (DB-append) so this stays testable.
async function decryptJournal({ row, actor_id, actor_role, reason, auditRead }, db = wbDb) {
  const isOwner = actor_role === 'student' && Number(actor_id) === Number(row.student_id);

  if (!isOwner) {
    // ⚠️ Counsellor only if the student EXPLICITLY shared this entry.
    if (actor_role === 'counsellor' && row.shared_with_counsellor) {
      if (!reason || reason.trim().length < WB_GUARDRAILS.MIN_REASON_CHARS) {
        throw new BadRequest('Reason required to read a shared journal entry.');
      }
      if (typeof auditRead === 'function') {
        await auditRead({
          org_id: row.org_id, actor_id, actor_role,
          subject_type: 'journal', subject_id: row.id,
          action: 'view', reason, at: new Date(),
        });
      }
    } else {
      throw new Forbidden(
        'Journal entries are private to the student. Only the student can read ' +
        'them, unless they have explicitly shared the entry with a counsellor.'
      );
    }
  }

  const key = await getStudentKey(row.student_id, db);
  try {
    return aesDecrypt(key, row);
  } finally {
    key.fill(0);
  }
}

// ─── Per-org counsellor key (session notes, referral reasons) ───
// Same wrapping scheme as the student key, scoped to the org's counselling team.
async function getOrgNoteKey(org_id, db = wbDb) {
  const row = await db.queryOne(
    'SELECT key_encrypted FROM wb_note_key WHERE org_id = ?', [org_id]
  );
  if (!row) {
    const dek = crypto.randomBytes(32);
    const wrapped = kms.wrap(dek);
    await db.query(
      'INSERT INTO wb_note_key (org_id, key_encrypted, created_at) VALUES (?,?,NOW())',
      [org_id, wrapped]
    );
    return dek;
  }
  return kms.unwrap(row.key_encrypted);
}

async function encryptNote({ org_id, plaintext }, db = wbDb) {
  const key = await getOrgNoteKey(org_id, db);
  try { return aesEncrypt(key, plaintext); } finally { key.fill(0); }
}

async function decryptNote({ org_id, row }, db = wbDb) {
  const key = await getOrgNoteKey(org_id, db);
  try { return aesDecrypt(key, row); } finally { key.fill(0); }
}

// ─── Anonymous reporter hash (Part 3.2) ─────────────────────────
// ⚠️ Daily-rotating salt = same student, different hash each day. This is a
//    FEATURE, not a bug: we deliberately cannot trace a reporter over time.
function reporterHash(student_id, org_id, date = new Date()) {
  const salt = process.env.WB_REPORT_SALT;
  if (!salt) throw new Error('WB_REPORT_SALT is not set.');
  const day = date.toISOString().slice(0, 10);
  const dailySalt = crypto.createHash('sha256').update(`${salt}:${day}:${org_id}`).digest();
  return crypto.createHmac('sha256', dailySalt).update(String(student_id)).digest('hex');
}

module.exports = {
  aesEncrypt, aesDecrypt,
  getStudentKey, encryptJournal, decryptJournal,
  getOrgNoteKey, encryptNote, decryptNote,
  reporterHash,
};

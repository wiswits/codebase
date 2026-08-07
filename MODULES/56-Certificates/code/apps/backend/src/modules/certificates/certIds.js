'use strict';
/*
 * Certificate identity — the number a recipient quotes, and the code that stops
 * that number being enumerated.
 *
 * TWO SEPARATE VALUES, deliberately:
 *   certificate_id  human-readable, sequential, printed, quotable — WWS-INT-2026-000128
 *   check_code      6 random chars, only ever seen inside the QR — ?c=7f3a9d
 *
 * Sequential IDs are what an organisation wants on paper and exactly what you must
 * NOT accept alone on a public endpoint: without the check code anyone could walk
 * 000001.. and harvest every recipient's name, department and dates. Verification
 * requires both, and answers a wrong/absent code identically to a missing record.
 */
const crypto = require('crypto');

// Ambiguity-free alphabet: no 0/O, no 1/l/I. The code is read off a printed page
// often enough (manual lookup form) that "was that a zero or an oh" is a real cost.
const CODE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

function makeCheckCode(len = 6) {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

/** Constant-time compare — a check code is a secret, so don't leak it by timing. */
function checkCodeMatches(supplied, stored) {
  const a = Buffer.from(String(supplied || ''), 'utf8');
  const b = Buffer.from(String(stored || ''), 'utf8');
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Expand an org's ID pattern.
 * Tokens: {PREFIX} {TYPE} {YYYY} {YY} {MM} {SEQ:n}
 * Unknown tokens are left alone rather than silently emptied — a visible
 * "{FOO}" in a preview is a bug report; an empty string is a mystery.
 */
function formatId(pattern, { prefix, typeCode, seq, date }) {
  const d = date instanceof Date ? date : new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return String(pattern || '{PREFIX}-{YYYY}-{SEQ:6}')
    .replace(/\{PREFIX\}/g, prefix || '')
    .replace(/\{TYPE\}/g, typeCode || '')
    .replace(/\{YYYY\}/g, yyyy)
    .replace(/\{YY\}/g, yyyy.slice(2))
    .replace(/\{MM\}/g, mm)
    .replace(/\{SEQ:(\d+)\}/g, (_, n) => String(seq).padStart(parseInt(n, 10) || 1, '0'))
    .replace(/\{SEQ\}/g, String(seq))
    // Collapse the double separator left behind when {TYPE} expands to nothing.
    .replace(/--+/g, '-')
    .replace(/\/\/+/g, '/')
    .replace(/^[-/]+|[-/]+$/g, '');
}

/**
 * Resolve the pattern actually used, honouring the "include the type's code"
 * setting.
 *
 * The setting is a checkbox labelled "Include the type's code in the ID"; the
 * default pattern is `{PREFIX}-{YYYY}-{SEQ:6}`, which has no {TYPE} token. So
 * with the box ticked the ID came out as DA-2026-000001 — the setting did
 * nothing at all, silently. A control that claims to change the certificate
 * number has to change it.
 *
 * If the box is ticked and the pattern has no {TYPE}, insert one right after
 * {PREFIX} (or at the front if there is no prefix token either). Untick it and
 * the token is dropped; formatId already collapses the separator it leaves.
 */
function effectivePattern(pattern, useTypePrefix) {
  const p = String(pattern || '{PREFIX}-{YYYY}-{SEQ:6}');
  if (!useTypePrefix || /\{TYPE\}/.test(p)) return p;
  return /\{PREFIX\}/.test(p) ? p.replace('{PREFIX}', '{PREFIX}-{TYPE}') : `{TYPE}-${p}`;
}

/**
 * Claim the next sequence value for (org, scope) inside the caller's transaction.
 *
 * Uses an UPSERT that increments in place, then reads the row back in the SAME
 * transaction. LAST_INSERT_ID(expr) makes MySQL hand the new value straight back,
 * so there is no read-then-write window for a second admin to slip into. Doing
 * this with MAX(certificate_id)+1 would race under exactly the load that matters
 * — two people generating at once.
 *
 * @param {(sql:string, params:any[]) => Promise<any>} exec  transaction-bound query fn
 */
async function nextSequence(exec, orgId, scopeKey) {
  await exec(
    `INSERT INTO client_cert_sequences (org_id, scope_key, next_val)
          VALUES (?, ?, LAST_INSERT_ID(1) + 1)
     ON DUPLICATE KEY UPDATE next_val = LAST_INSERT_ID(next_val) + 1`,
    [orgId, scopeKey]
  );
  const rows = await exec('SELECT LAST_INSERT_ID() AS seq', []);
  const seq = Array.isArray(rows) ? Number(rows[0]?.seq) : Number(rows?.seq);
  return Number.isFinite(seq) && seq > 0 ? seq : 1;
}

/** Validate a user-supplied prefix/code before it is baked into permanent IDs. */
function sanitiseCode(v, max = 12) {
  return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, max);
}

module.exports = { makeCheckCode, checkCodeMatches, formatId, effectivePattern, nextSequence, sanitiseCode, CODE_ALPHABET };

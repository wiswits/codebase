'use strict';
const { pool } = require('../../../config/db');

/**
 * Collapse the many ways a school writes a session into one.
 *
 * This is the fix for a bug that needed no concurrency at all to fire. The
 * EduSuite original keyed its counter on the raw string and derived the number's
 * prefix from the first four-digit run in it, so "2026-2027", "2026/27",
 * "2026-27" and "AY 2026" were four separate counters that all minted numbers
 * with the same prefix. Two of them at sequence 1 produced the identical
 * admission number, the unique index rejected the second, and the front office
 * saw "an unexpected server error" while trying to admit a child.
 *
 *   2026-2027 | 2026/27 | 2026-27 | AY 2026-27  ->  2026-2027
 *   2026      | AY 2026                          ->  2026
 */
function normalizeSession(raw) {
  const text = String(raw == null ? '' : raw);

  // The lookarounds are load-bearing. An unanchored /\d{4}/ matches a four-digit
  // WINDOW rather than a four-digit YEAR, so "02026" became "202" and — far
  // worse — "Batch 12345" and "Batch 12346" both matched "1234" and were handed
  // the SAME counter, which is the exact class of bug this function exists to
  // prevent. A run of digits that is not exactly four long is not a year.
  const years = text.match(/(?<!\d)\d{4}(?!\d)/g) || [];

  if (years.length === 0) {
    // Nothing year-shaped in it. Keep the school's own wording, just tidied, so
    // a session named "Batch A" still gets its own counter.
    return text.trim().replace(/\s+/g, ' ').slice(0, 50);
  }

  // A trailing two-digit year ("2026-27", "2026/27") means the same span as
  // "2026-2027" and must share its counter. The start year is taken from THIS
  // match rather than from years[0], so the two halves can never come from
  // different places in the string.
  const shortEnd = text.match(/(?<!\d)(\d{4})\s*[-/]\s*(\d{2})(?!\d)/);
  if (shortEnd) {
    const start = Number(shortEnd[1]);
    const end = Number(String(start).slice(0, 2) + shortEnd[2]);
    return `${start}-${end > start ? end : start + 1}`;
  }

  const start = Number(years[0]);
  if (years.length >= 2 && Number(years[1]) > start) return `${start}-${Number(years[1])}`;
  return String(start);
}

function formatNumber(prefix, session, sequence) {
  // Padded to four so a year's numbers sort and read consistently. Past 9999 it
  // simply grows rather than truncating — a school that admits ten thousand
  // students in one session should get 10000, not a silently reused number.
  return `${prefix}/${session}/${String(sequence).padStart(4, '0')}`;
}

/**
 * Draw the next number for (org, session), atomically, in ONE statement.
 *
 * The upstream version did SELECT ... FOR UPDATE, then INSERT if missing inside
 * an empty catch, then re-SELECT, then UPDATE, then SELECT again. On a cold
 * start two concurrent admissions both took a gap lock on the absent row and
 * deadlocked; the empty catch swallowed it, but MariaDB had already rolled the
 * transaction back server-side, so everything after it ran unprotected and two
 * requests could mint the same number.
 *
 * INSERT ... ON DUPLICATE KEY UPDATE has no such window: the unique key does the
 * work, there is no gap to lock, and LAST_INSERT_ID carries the new value back
 * on the same round trip. affectedRows tells the two cases apart — 1 means the
 * row was created (so this is the first number), 2 means it was incremented.
 */
async function allocateNumber(orgId, rawSession, defaultPrefix, connection = pool) {
  const session = normalizeSession(rawSession);
  const [result] = await connection.execute(
    `INSERT INTO client_admission_number_series (org_id, academic_session, prefix, current_sequence)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE current_sequence = LAST_INSERT_ID(current_sequence + 1)`,
    [orgId, session, defaultPrefix]
  );

  const sequence = result.affectedRows === 1 ? 1 : Number(result.insertId);

  // The prefix is whatever the school has configured on the row, which may
  // differ from the default we would have inserted.
  const [rows] = await connection.execute(
    `SELECT prefix FROM client_admission_number_series
     WHERE org_id = ? AND academic_session = ? LIMIT 1`,
    [orgId, session]
  );
  const prefix = (rows[0] && rows[0].prefix) || defaultPrefix;

  return { number: formatNumber(prefix, session, sequence), session, sequence, prefix };
}

async function listSeries(orgId) {
  const [rows] = await pool.execute(
    `SELECT id, org_id AS orgId, academic_session AS academicSession, prefix,
            current_sequence AS currentSequence, created_at AS createdAt, updated_at AS updatedAt
     FROM client_admission_number_series
     WHERE org_id = ?
     ORDER BY academic_session DESC`,
    [orgId]
  );
  return rows;
}

/**
 * Set the prefix for a session. The counter itself is never editable from the
 * API: winding it back would hand the next child a number another child already
 * has, and that number is on a printed form somewhere.
 */
async function setPrefix(orgId, rawSession, prefix) {
  const session = normalizeSession(rawSession);
  await pool.execute(
    `INSERT INTO client_admission_number_series (org_id, academic_session, prefix, current_sequence)
     VALUES (?, ?, ?, 0)
     ON DUPLICATE KEY UPDATE prefix = VALUES(prefix)`,
    [orgId, session, prefix]
  );
  const [rows] = await pool.execute(
    `SELECT id, org_id AS orgId, academic_session AS academicSession, prefix,
            current_sequence AS currentSequence
     FROM client_admission_number_series
     WHERE org_id = ? AND academic_session = ? LIMIT 1`,
    [orgId, session]
  );
  return rows[0] || null;
}

module.exports = { normalizeSession, formatNumber, allocateNumber, listSeries, setPrefix };

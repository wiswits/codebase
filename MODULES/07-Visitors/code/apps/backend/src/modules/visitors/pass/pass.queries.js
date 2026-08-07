'use strict';
const { pool } = require('../../../config/db');

/**
 * A pass is stored as 'active' until something revokes it, but a pass whose
 * expires_at has gone by is not active any more. Upstream stored an 'expired'
 * state that nothing ever wrote and nothing ever read, so a lapsed pass sat
 * there reading 'active' forever. Deriving it here means there is one answer and
 * no sweeper job to forget to run.
 */
const SELECT_FIELDS = `
  id,
  org_id AS orgId,
  visitor_log_id AS visitorLogId,
  pass_code AS passCode,
  CASE
    WHEN status = 'active' AND expires_at IS NOT NULL AND expires_at <= NOW()
    THEN 'expired'
    ELSE status
  END AS status,
  issued_at AS issuedAt,
  expires_at AS expiresAt,
  revoked_at AS revokedAt,
  issued_by AS issuedBy,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

// The newest pass for a visit, whatever its state — this is what the detail
// view shows.
async function findLatestPassByVisitorId(orgId, visitorId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_visitor_passes
     WHERE org_id = ? AND visitor_log_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [orgId, visitorId]
  );
  return rows[0] || null;
}

// A currently-valid pass: still 'active' AND not past its expiry.
async function findActivePassByVisitorId(orgId, visitorId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_visitor_passes
     WHERE org_id = ? AND visitor_log_id = ?
       AND status = 'active'
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY id DESC
     LIMIT 1`,
    [orgId, visitorId]
  );
  return rows[0] || null;
}

async function findPassById(orgId, passId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_visitor_passes
     WHERE org_id = ? AND id = ?
     LIMIT 1`,
    [orgId, passId]
  );
  return rows[0] || null;
}

async function insertPass({ orgId, visitorId, passCode, expiresAt, userId }, connection) {
  const [result] = await connection.execute(
    `INSERT INTO client_visitor_passes
      (org_id, visitor_log_id, pass_code, status, expires_at, issued_by)
     VALUES (?, ?, ?, 'active', ?, ?)`,
    [orgId, visitorId, passCode, expiresAt || null, userId || null]
  );
  return result.insertId;
}

/**
 * Called when a visit reaches a terminal state. Runs inside the same
 * transaction as the status change: upstream did this afterwards and outside
 * any transaction, so a crash in between left a live pass on a visitor who had
 * already walked out.
 */
async function revokePassesForVisitor(orgId, visitorId, connection = pool) {
  const [result] = await connection.execute(
    `UPDATE client_visitor_passes
     SET status = 'revoked', revoked_at = NOW()
     WHERE org_id = ? AND visitor_log_id = ? AND status = 'active'`,
    [orgId, visitorId]
  );
  return result.affectedRows;
}

module.exports = {
  findLatestPassByVisitorId,
  findActivePassByVisitorId,
  findPassById,
  insertPass,
  revokePassesForVisitor,
};

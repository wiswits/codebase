'use strict';
const { pool } = require('../../../config/db');
const { BRANCH_SQL, pushBranchFilter } = require('../../../utils/activeSchool');

const SELECT_FIELDS = `
  id,
  org_id AS orgId,
  visitor_name AS visitorName,
  visitor_phone AS visitorPhone,
  visitor_email AS visitorEmail,
  visitor_type AS visitorType,
  purpose,
  host_id AS hostId,
  host_name AS hostName,
  check_in_at AS checkInAt,
  check_out_at AS checkOutAt,
  status,
  checked_in_by AS checkedInBy,
  checked_out_by AS checkedOutBy,
  cancelled_by AS cancelledBy,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

async function listVisitors(orgId, { search, status, visitorType, page, limit, schoolId }) {
  const offset = (page - 1) * limit;

  const conditions = ['org_id = ?'];
  const params = [orgId];

  // A visitor walks through one gate. A branch-bound admin runs one gate, and
  // has no business reading the other campus's register — name, phone, who they
  // came to see and why is all here.
  pushBranchFilter(conditions, params, schoolId);

  if (search) {
    conditions.push(
      '(visitor_name LIKE ? OR visitor_phone LIKE ? OR visitor_email LIKE ? OR purpose LIKE ? OR host_name LIKE ?)'
    );
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (visitorType) {
    conditions.push('visitor_type = ?');
    params.push(visitorType);
  }

  const whereClause = conditions.join(' AND ');

  // pool.query (not execute) for the paginated SELECT: mysql2's prepared-statement
  // protocol rejects `LIMIT ?/OFFSET ?` on some engines (ER_WRONG_ARGUMENTS).
  // query() still escapes the `?` params — injection-safe, portable across
  // MariaDB (prod) and MySQL (local).
  //
  // The active-pass code rides along so the register can show who is holding a
  // gate pass without a second round trip. A pass whose expires_at has passed is
  // not active any more, so it is excluded here rather than reported as live.
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS},
       (SELECT pass_code FROM client_visitor_passes p
         WHERE p.org_id = client_visitor_logs.org_id
           AND p.visitor_log_id = client_visitor_logs.id
           AND p.status = 'active'
           AND (p.expires_at IS NULL OR p.expires_at > NOW())
         ORDER BY p.id DESC LIMIT 1) AS activePassCode
     FROM client_visitor_logs
     WHERE ${whereClause}
     ORDER BY check_in_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM client_visitor_logs WHERE ${whereClause}`,
    params
  );

  return { rows, total: Number(countRows[0].total) };
}

async function findVisitorById(orgId, visitorId, connection = pool, schoolId = null) {
  const [rows] = await connection.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_visitor_logs
     WHERE id = ? AND org_id = ? AND ${BRANCH_SQL}
     LIMIT 1`,
    [visitorId, orgId, schoolId, schoolId]
  );
  return rows[0] || null;
}

// Row-locked read, for the transactions that must not race a concurrent
// checkout/cancel/pass-issue on the same visit.
async function findVisitorByIdForUpdate(orgId, visitorId, connection, schoolId = null) {
  const [rows] = await connection.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_visitor_logs
     WHERE id = ? AND org_id = ? AND ${BRANCH_SQL}
     LIMIT 1
     FOR UPDATE`,
    [visitorId, orgId, schoolId, schoolId]
  );
  return rows[0] || null;
}

async function createVisitor(data, orgId, userId, schoolId = null) {
  // Stamped with the branch the request resolved to. An unscoped caller leaves
  // NULL rather than being guessed onto the primary campus — a wrong gate on a
  // visitor record is worse than no gate.
  const [result] = await pool.execute(
    `INSERT INTO client_visitor_logs
      (org_id, school_id, visitor_name, visitor_phone, visitor_email, visitor_type,
       purpose, host_id, host_name, status, checked_in_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'checked_in', ?)`,
    [
      orgId,
      schoolId,
      data.visitorName,
      data.visitorPhone || null,
      data.visitorEmail || null,
      data.visitorType || null,
      data.purpose,
      data.hostId,
      data.hostName || null,
      userId || null,
    ]
  );
  return findVisitorById(orgId, result.insertId, pool, schoolId);
}

/**
 * Close a visit. The `AND status = 'checked_in'` in the UPDATE is the real
 * concurrency guard — the service's pre-check can be overtaken between the read
 * and the write, and without this clause two racing requests would both stamp an
 * exit time. affectedRows === 0 means somebody else got there first.
 */
async function checkOutVisitor(orgId, visitorId, userId, connection = pool, schoolId = null) {
  const [result] = await connection.execute(
    `UPDATE client_visitor_logs
     SET status = 'checked_out', check_out_at = NOW(), checked_out_by = ?
     WHERE id = ? AND org_id = ? AND status = 'checked_in' AND ${BRANCH_SQL}`,
    [userId || null, visitorId, orgId, schoolId, schoolId]
  );
  if (result.affectedRows === 0) return null;
  return findVisitorById(orgId, visitorId, connection, schoolId);
}

async function cancelVisitor(orgId, visitorId, userId, connection = pool, schoolId = null) {
  const [result] = await connection.execute(
    `UPDATE client_visitor_logs
     SET status = 'cancelled', cancelled_by = ?
     WHERE id = ? AND org_id = ? AND status = 'checked_in' AND ${BRANCH_SQL}`,
    [userId || null, visitorId, orgId, schoolId, schoolId]
  );
  if (result.affectedRows === 0) return null;
  return findVisitorById(orgId, visitorId, connection, schoolId);
}

// Register counts for the page's summary row, in one pass over the org's rows.
async function visitorCounts(orgId, schoolId = null) {
  const [rows] = await pool.execute(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'checked_in')  AS checkedIn,
       SUM(status = 'checked_out') AS checkedOut,
       SUM(status = 'cancelled')   AS cancelled
     FROM client_visitor_logs
     WHERE org_id = ? AND ${BRANCH_SQL}`,
    [orgId, schoolId, schoolId]
  );
  const r = rows[0] || {};
  return {
    total: Number(r.total || 0),
    checkedIn: Number(r.checkedIn || 0),
    checkedOut: Number(r.checkedOut || 0),
    cancelled: Number(r.cancelled || 0),
  };
}

module.exports = {
  listVisitors,
  findVisitorById,
  findVisitorByIdForUpdate,
  createVisitor,
  checkOutVisitor,
  cancelVisitor,
  visitorCounts,
};

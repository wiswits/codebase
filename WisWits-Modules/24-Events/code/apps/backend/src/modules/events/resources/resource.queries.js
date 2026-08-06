'use strict';
const { pool } = require('../../../config/db');
const { BRANCH_SQL } = require('../../../utils/activeSchool');

// All queries tenant-scoped by org_id, and by branch where the org has more
// than one. A booking carries no branch of its own — it inherits the resource's,
// because the hall is the thing that stands at a campus.
const BOOKING_BRANCH_SQL = `(? IS NULL OR resource_id IN (
  SELECT id FROM client_em_event_resources WHERE org_id = ? AND (school_id IS NULL OR school_id = ?)))`;
const bookingBranchParams = (orgId, schoolId) => [schoolId, orgId, schoolId];

async function listResources(orgId, { page, limit, schoolId = null }) {
  const offset = (page - 1) * limit;
  // pool.query for LIMIT/OFFSET pagination (see note in core/event.queries.js).
  const [rows] = await pool.query(
    `SELECT id, name, resource_type AS resourceType, description, quantity, status,
            created_at AS createdAt, updated_at AS updatedAt
     FROM client_em_event_resources
     WHERE org_id = ? AND ${BRANCH_SQL}
     ORDER BY name ASC
     LIMIT ? OFFSET ?`,
    [orgId, schoolId, schoolId, limit, offset]
  );
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM client_em_event_resources WHERE org_id = ? AND ${BRANCH_SQL}`,
    [orgId, schoolId, schoolId]
  );
  return { rows, total: Number(countRows[0].total) };
}

async function findResourceById(orgId, resourceId, connection = pool, schoolId = null) {
  const [rows] = await connection.execute(
    `SELECT id, name, resource_type AS resourceType, description, quantity, status,
            created_at AS createdAt, updated_at AS updatedAt
     FROM client_em_event_resources
     WHERE id = ? AND org_id = ? AND ${BRANCH_SQL}
     LIMIT 1`,
    [resourceId, orgId, schoolId, schoolId]
  );
  return rows[0] || null;
}

async function findOverlappingBookings(
  orgId, resourceId, startTime, endTime,
  connection = pool, { forUpdate = false, excludeBookingId = null } = {}
) {
  const params = [orgId, resourceId, endTime, startTime];
  let excludeClause = '';
  if (excludeBookingId) {
    excludeClause = 'AND id != ?';
    params.push(excludeBookingId);
  }
  const lockClause = forUpdate ? 'FOR UPDATE' : '';
  const [rows] = await connection.execute(
    `SELECT id, event_id AS eventId, resource_id AS resourceId,
            booking_start AS startTime, booking_end AS endTime
     FROM client_em_event_resource_bookings
     WHERE org_id = ? AND resource_id = ?
       AND booking_start < ? AND booking_end > ?
       ${excludeClause}
       ${lockClause}`,
    params
  );
  return rows;
}

async function listBookingsForResource(orgId, resourceId, { rangeStart, rangeEnd } = {}) {
  const params = [orgId, resourceId];
  let rangeClause = '';
  if (rangeStart && rangeEnd) {
    rangeClause = 'AND booking_start < ? AND booking_end > ?';
    params.push(rangeEnd, rangeStart);
  }
  const [rows] = await pool.execute(
    `SELECT id, event_id AS eventId, booking_start AS startTime, booking_end AS endTime, status
     FROM client_em_event_resource_bookings
     WHERE org_id = ? AND resource_id = ? ${rangeClause}
     ORDER BY booking_start ASC`,
    params
  );
  return rows;
}

async function createBooking(orgId, eventId, resourceId, startTime, endTime, bookedBy, connection = pool, schoolId = null) {
  const [result] = await connection.execute(
    `INSERT INTO client_em_event_resource_bookings
       (org_id, event_id, resource_id, quantity, booking_start, booking_end, status)
     VALUES (?, ?, ?, 1, ?, ?, 'reserved')`,
    [orgId, eventId, resourceId, startTime, endTime]
  );
  return findBookingById(orgId, result.insertId, connection, schoolId);
}

async function findBookingById(orgId, bookingId, connection = pool, schoolId = null) {
  const [rows] = await connection.execute(
    `SELECT id, event_id AS eventId, resource_id AS resourceId, quantity,
            booking_start AS startTime, booking_end AS endTime, status,
            created_at AS createdAt, updated_at AS updatedAt
     FROM client_em_event_resource_bookings
     WHERE id = ? AND org_id = ? AND ${BOOKING_BRANCH_SQL}
     LIMIT 1`,
    [bookingId, orgId, ...bookingBranchParams(orgId, schoolId)]
  );
  return rows[0] || null;
}

async function deleteBooking(orgId, bookingId, connection = pool, schoolId = null) {
  const [result] = await connection.execute(
    `DELETE FROM client_em_event_resource_bookings
      WHERE id = ? AND org_id = ? AND ${BOOKING_BRANCH_SQL}`,
    [bookingId, orgId, ...bookingBranchParams(orgId, schoolId)]
  );
  return result.affectedRows > 0;
}

module.exports = {
  listResources, findResourceById, findOverlappingBookings, listBookingsForResource,
  createBooking, findBookingById, deleteBooking,
};

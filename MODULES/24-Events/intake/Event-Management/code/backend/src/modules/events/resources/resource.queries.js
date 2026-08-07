const { pool } = require('../../../config/db');

/**
 * MariaDB queries for Event Management resources and bookings.
 * All queries are tenant-scoped using org_id.
 */

async function listResources(orgId, { page, limit }) {
  const offset = (page - 1) * limit;

  const [rows] = await pool.execute(
    `SELECT
       id,
       name,
       resource_type AS resourceType,
       description,
       quantity,
       status,
       created_at AS createdAt,
       updated_at AS updatedAt
     FROM client_event_resources
     WHERE org_id = ?
     ORDER BY name ASC
     LIMIT ? OFFSET ?`,
    [orgId, limit, offset]
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM client_event_resources
     WHERE org_id = ?`,
    [orgId]
  );

  return {
    rows,
    total: Number(countRows[0].total),
  };
}

async function findResourceById(
  orgId,
  resourceId,
  connection = pool
) {
  const [rows] = await connection.execute(
    `SELECT
       id,
       name,
       resource_type AS resourceType,
       description,
       quantity,
       status,
       created_at AS createdAt,
       updated_at AS updatedAt
     FROM client_event_resources
     WHERE id = ?
       AND org_id = ?
     LIMIT 1`,
    [resourceId, orgId]
  );

  return rows[0] || null;
}

async function findOverlappingBookings(
  orgId,
  resourceId,
  startTime,
  endTime,
  connection = pool,
  { forUpdate = false, excludeBookingId = null } = {}
) {
  const params = [
    orgId,
    resourceId,
    endTime,
    startTime,
  ];

  let excludeClause = '';

  if (excludeBookingId) {
    excludeClause = 'AND id != ?';
    params.push(excludeBookingId);
  }

  const lockClause = forUpdate ? 'FOR UPDATE' : '';

  const [rows] = await connection.execute(
  `SELECT
      id,
      event_id AS eventId,
      resource_id AS resourceId,
      booking_start AS startTime,
      booking_end AS endTime
   FROM client_event_resource_bookings
   WHERE org_id = ?
     AND resource_id = ?
     AND booking_start < ?
     AND booking_end > ?
     ${excludeClause}
     ${lockClause}`,
  params
);

  return rows;
}

async function listBookingsForResource(
  orgId,
  resourceId,
  { rangeStart, rangeEnd } = {}
) {
  const params = [orgId, resourceId];

  let rangeClause = '';

  if (rangeStart && rangeEnd) {
    rangeClause = 'AND booking_start < ? AND booking_end > ?';

    params.push(rangeEnd, rangeStart);
  }

 const [rows] = await pool.execute(
  `SELECT
      id,
      event_id AS eventId,
      booking_start AS startTime,
      booking_end AS endTime,
      status
   FROM client_event_resource_bookings
   WHERE org_id = ?
     AND resource_id = ?
     ${rangeClause}
   ORDER BY booking_start ASC`,
  params
);

  return rows;
}

async function createBooking(
  orgId,
  eventId,
  resourceId,
  startTime,
  endTime,
  bookedBy,
  connection = pool
) {
  const [result] = await connection.execute(
    `INSERT INTO client_event_resource_bookings
       (
         org_id,
         event_id,
         resource_id,
         quantity,
         booking_start,
         booking_end,
         status
       )
     VALUES (?, ?, ?, 1, ?, ?, 'reserved')`,
    [orgId, eventId, resourceId, startTime, endTime]
  );

  return findBookingById(orgId, result.insertId, connection);
}

async function findBookingById(
  orgId,
  bookingId,
  connection = pool
) {
  const [rows] = await connection.execute(
  `SELECT
      id,
      event_id AS eventId,
      resource_id AS resourceId,
      quantity,
      booking_start AS startTime,
      booking_end AS endTime,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
   FROM client_event_resource_bookings
   WHERE id = ?
     AND org_id = ?
   LIMIT 1`,
  [bookingId, orgId]
);
  return rows[0] || null;
}

async function deleteBooking(
  orgId,
  bookingId,
  connection = pool
) {
  const [result] = await connection.execute(
  `DELETE FROM client_event_resource_bookings
   WHERE id = ? AND org_id = ?`,
  [bookingId, orgId]
);
 

  return result.affectedRows > 0;
}

module.exports = {
  listResources,
  findResourceById,
  findOverlappingBookings,
  listBookingsForResource,
  createBooking,
  findBookingById,
  deleteBooking,
};
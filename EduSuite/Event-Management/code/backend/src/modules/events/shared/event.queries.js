const { pool } = require('../../../config/db');

const SELECT_FIELDS = `
  id,
  org_id AS orgId,
  title,
  description,
  event_type AS eventType,
  start_datetime AS startDatetime,
  end_datetime AS endDatetime,
  location,
  capacity,
  rsvp_enabled AS rsvpEnabled,
  rsvp_deadline AS rsvpDeadline,
  status,
  created_by AS createdBy,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

async function findEventById(orgId, eventId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_events
     WHERE id = ? AND org_id = ?
     LIMIT 1`,
    [eventId, orgId]
  );

  return rows[0] || null;
}

async function findEventByIdForUpdate(orgId, eventId, connection) {
  const [rows] = await connection.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_events
     WHERE id = ? AND org_id = ?
     LIMIT 1
     FOR UPDATE`,
    [eventId, orgId]
  );

  return rows[0] || null;
}

module.exports = {
  findEventById,
  findEventByIdForUpdate,
};
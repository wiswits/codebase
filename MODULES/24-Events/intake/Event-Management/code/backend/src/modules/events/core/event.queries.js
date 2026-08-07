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
  status,
  created_by AS createdBy,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

async function listEvents(
  orgId,
  { search, status, startDate, endDate, page, limit }
) {
  const offset = (page - 1) * limit;

  const conditions = ['org_id = ?'];
  const params = [orgId];

  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (startDate) {
    conditions.push('start_datetime >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('end_datetime <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.join(' AND ');

  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_events
     WHERE ${whereClause}
     ORDER BY start_datetime ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM client_events
     WHERE ${whereClause}`,
    params
  );

  return {
    rows,
    total: Number(countRows[0].total),
  };
}

async function findEventById(orgId, eventId) {
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_events
     WHERE id = ? AND org_id = ?
     LIMIT 1`,
    [eventId, orgId]
  );

  return rows[0] || null;
}

async function createEvent(data, orgId, userId) {
  const [result] = await pool.execute(
    `INSERT INTO client_events
      (
        org_id,
        title,
        description,
        event_type,
        start_datetime,
        end_datetime,
        location,
        capacity,
        status,
        created_by
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orgId,
      data.title,
      data.description || null,
      data.eventType || null,
      data.startDatetime,
      data.endDatetime,
      data.location || null,
      data.capacity ?? null,
      data.status || 'draft',
      userId || null,
    ]
  );

  return findEventById(orgId, result.insertId);
}

async function updateEvent(eventId, data, orgId) {
  const allowedFields = {
    title: 'title',
    description: 'description',
    eventType: 'event_type',
    startDatetime: 'start_datetime',
    endDatetime: 'end_datetime',
    location: 'location',
    capacity: 'capacity',
    status: 'status',
  };

  const updates = [];
  const params = [];

  for (const [key, column] of Object.entries(allowedFields)) {
    if (data[key] !== undefined) {
      updates.push(`${column} = ?`);
      params.push(data[key]);
    }
  }

  if (updates.length === 0) {
    return findEventById(orgId, eventId);
  }

  params.push(eventId, orgId);

  const [result] = await pool.execute(
    `UPDATE client_events
     SET ${updates.join(', ')}
     WHERE id = ? AND org_id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findEventById(orgId, eventId);
}

async function updateEventStatus(eventId, status, orgId) {
  const [result] = await pool.execute(
    `UPDATE client_events
     SET status = ?
     WHERE id = ? AND org_id = ?`,
    [status, eventId, orgId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findEventById(orgId, eventId);
}

module.exports = {
  listEvents,
  findEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
};
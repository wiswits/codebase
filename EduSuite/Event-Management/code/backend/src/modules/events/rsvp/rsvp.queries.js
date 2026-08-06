const { pool } = require('../../../config/db');

async function findRsvpByEventAndUser(
  orgId,
  eventId,
  userId,
  connection = pool
) {
  const [rows] = await connection.execute(
    `SELECT
        id,
        event_id AS eventId,
        user_id AS userId,
        response_status AS status,
        responded_at AS respondedAt,
        created_at AS createdAt,
        updated_at AS updatedAt
     FROM client_event_rsvps
     WHERE org_id = ?
       AND event_id = ?
       AND user_id = ?
     LIMIT 1`,
    [orgId, eventId, userId]
  );

  return rows[0] || null;
}

async function countGoingRsvps(
  orgId,
  eventId,
  connection = pool,
  { forUpdate = false } = {}
) {
  /*
   * The event row is already locked by findEventByIdForUpdate()
   * in the service transaction. Avoid FOR UPDATE on COUNT(),
   * which is problematic for aggregate queries.
   */
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM client_event_rsvps
     WHERE org_id = ?
       AND event_id = ?
       AND response_status = 'going'`,
    [orgId, eventId]
  );

  return Number(rows[0].count);
}

async function upsertRsvp(
  orgId,
  eventId,
  userId,
  status,
  connection = pool
) {
  const existing = await findRsvpByEventAndUser(
    orgId,
    eventId,
    userId,
    connection
  );

  if (existing) {
    await connection.execute(
      `UPDATE client_event_rsvps
       SET response_status = ?,
           responded_at = NOW(),
           updated_at = NOW()
       WHERE org_id = ?
         AND event_id = ?
         AND user_id = ?`,
      [status, orgId, eventId, userId]
    );
  } else {
    await connection.execute(
      `INSERT INTO client_event_rsvps
        (
          org_id,
          event_id,
          user_id,
          response_status,
          responded_at,
          created_at,
          updated_at
        )
       VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [orgId, eventId, userId, status]
    );
  }

  return findRsvpByEventAndUser(
    orgId,
    eventId,
    userId,
    connection
  );
}

async function listRsvpsByEvent(
  orgId,
  eventId,
  { status, page, limit }
) {
  const offset = (page - 1) * limit;

  const params = [orgId, eventId];

  let statusClause = '';

  if (status) {
    statusClause = 'AND response_status = ?';
    params.push(status);
  }

  const [rows] = await pool.execute(
    `SELECT
        id,
        user_id AS userId,
        response_status AS status,
        responded_at AS respondedAt,
        created_at AS createdAt,
        updated_at AS updatedAt
     FROM client_event_rsvps
     WHERE org_id = ?
       AND event_id = ?
       ${statusClause}
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM client_event_rsvps
     WHERE org_id = ?
       AND event_id = ?
       ${statusClause}`,
    params
  );

  return {
    rows,
    total: Number(countRows[0].total),
  };
}

async function countByStatus(orgId, eventId) {
  const [rows] = await pool.execute(
    `SELECT
        response_status AS status,
        COUNT(*) AS count
     FROM client_event_rsvps
     WHERE org_id = ?
       AND event_id = ?
     GROUP BY response_status`,
    [orgId, eventId]
  );

  const counts = {
    going: 0,
    maybe: 0,
    not_going: 0,
  };

  for (const row of rows) {
    counts[row.status] = Number(row.count);
  }

  return counts;
}

module.exports = {
  findRsvpByEventAndUser,
  countGoingRsvps,
  upsertRsvp,
  listRsvpsByEvent,
  countByStatus,
};
'use strict';
const { pool } = require('../../../config/db');
const { BRANCH_SQL } = require('../../../utils/activeSchool');

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
  archived_at AS archivedAt,
  deleted_at AS deletedAt,
  gallery_album_id AS galleryAlbumId,
  created_by AS createdBy,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

// This is the lookup the RSVP and resource-booking flows gate on, so it carries
// the branch predicate too. Without it a branch-A user could not SEE a branch-B
// event but could still RSVP to one, or book its hall, by posting the id.
async function findEventById(orgId, eventId, connection = pool, schoolId = null) {
  const [rows] = await connection.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_em_events
     WHERE id = ? AND org_id = ? AND ${BRANCH_SQL}
     LIMIT 1`,
    [eventId, orgId, schoolId, schoolId]
  );
  return rows[0] || null;
}

async function findEventByIdForUpdate(orgId, eventId, connection, schoolId = null) {
  const [rows] = await connection.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_em_events
     WHERE id = ? AND org_id = ? AND ${BRANCH_SQL}
     LIMIT 1
     FOR UPDATE`,
    [eventId, orgId, schoolId, schoolId]
  );
  return rows[0] || null;
}

module.exports = { findEventById, findEventByIdForUpdate };

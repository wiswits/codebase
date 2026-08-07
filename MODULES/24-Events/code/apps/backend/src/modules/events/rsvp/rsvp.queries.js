'use strict';
const { pool } = require('../../../config/db');

async function findRsvpByEventAndUser(orgId, eventId, userId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT id, event_id AS eventId, user_id AS userId, response_status AS status,
            responded_at AS respondedAt, created_at AS createdAt, updated_at AS updatedAt
     FROM client_em_event_rsvps
     WHERE org_id = ? AND event_id = ? AND user_id = ?
     LIMIT 1`,
    [orgId, eventId, userId]
  );
  return rows[0] || null;
}

async function countGoingRsvps(orgId, eventId, connection = pool) {
  // The event row is already locked by findEventByIdForUpdate() in the service
  // transaction. Avoid FOR UPDATE on COUNT() (problematic for aggregates).
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM client_em_event_rsvps
     WHERE org_id = ? AND event_id = ? AND response_status = 'going'`,
    [orgId, eventId]
  );
  return Number(rows[0].count);
}

async function upsertRsvp(orgId, eventId, userId, status, connection = pool) {
  const existing = await findRsvpByEventAndUser(orgId, eventId, userId, connection);
  if (existing) {
    await connection.execute(
      `UPDATE client_em_event_rsvps
       SET response_status = ?, responded_at = NOW(), updated_at = NOW()
       WHERE org_id = ? AND event_id = ? AND user_id = ?`,
      [status, orgId, eventId, userId]
    );
  } else {
    await connection.execute(
      `INSERT INTO client_em_event_rsvps
        (org_id, event_id, user_id, response_status, responded_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [orgId, eventId, userId, status]
    );
  }
  return findRsvpByEventAndUser(orgId, eventId, userId, connection);
}

async function listRsvpsByEvent(orgId, eventId, { status, page, limit }) {
  const offset = (page - 1) * limit;
  const params = [orgId, eventId];
  let statusClause = '';
  if (status) {
    statusClause = 'AND response_status = ?';
    params.push(status);
  }

  // pool.query for LIMIT/OFFSET pagination (see note in core/event.queries.js).
  // LEFT JOIN client_users so the RSVP summary shows real names/emails instead of
  // raw user ids (managers need to know WHO responded).
  //
  // Everything past the name is a CORRELATED SUBQUERY, not a join, on purpose: a
  // parent with three children joined against client_parent_students would print
  // three rows for one RSVP, and an attendance sheet that counts one person as
  // three is worse than no sheet. One RSVP is one row here, always.
  //
  // The extra columns exist because a printed guest list has to be usable at the
  // gate: a name alone does not tell the person holding the clipboard whether
  // "Sunita Sharma" is a teacher, a Class 6 student, or somebody's mother.
  const [rows] = await pool.query(
    `SELECT r.id, r.user_id AS userId, r.response_status AS status,
            r.responded_at AS respondedAt, r.created_at AS createdAt, r.updated_at AS updatedAt,
            TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS userName,
            u.email AS userEmail,
            u.phone AS userPhone,
            u.designation AS designation,
            (SELECT ro.base_role
               FROM client_user_roles ur
               JOIN client_roles ro ON ro.id = ur.role_id
              WHERE ur.user_id = u.id
              ORDER BY (ro.level IS NULL), ro.level ASC
              LIMIT 1) AS baseRole,
            (SELECT c.name
               FROM client_students st
               JOIN client_enrollments e ON e.student_id = st.id AND e.status = 'active'
               JOIN client_sections sec ON sec.id = e.section_id
               JOIN client_classes c ON c.id = sec.class_id
              WHERE st.user_id = u.id AND st.org_id = r.org_id
              LIMIT 1) AS className,
            (SELECT sec.name
               FROM client_students st
               JOIN client_enrollments e ON e.student_id = st.id AND e.status = 'active'
               JOIN client_sections sec ON sec.id = e.section_id
              WHERE st.user_id = u.id AND st.org_id = r.org_id
              LIMIT 1) AS sectionName,
            (SELECT ps.relation
               FROM client_parents p
               JOIN client_parent_students ps ON ps.parent_id = p.id AND ps.org_id = p.org_id
              WHERE p.user_id = u.id AND p.org_id = r.org_id
              ORDER BY ps.is_primary DESC, ps.id ASC
              LIMIT 1) AS parentRelation,
            (SELECT TRIM(CONCAT(COALESCE(su.first_name, ''), ' ', COALESCE(su.last_name, '')))
               FROM client_parents p
               JOIN client_parent_students ps ON ps.parent_id = p.id AND ps.org_id = p.org_id
               JOIN client_students cst ON cst.id = ps.student_id
               JOIN client_users su ON su.id = cst.user_id
              WHERE p.user_id = u.id AND p.org_id = r.org_id
              ORDER BY ps.is_primary DESC, ps.id ASC
              LIMIT 1) AS childName
     FROM client_em_event_rsvps r
     LEFT JOIN client_users u ON u.id = r.user_id AND u.org_id = r.org_id
     WHERE r.org_id = ? AND r.event_id = ? ${statusClause.replace('response_status', 'r.response_status')}
     ORDER BY r.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM client_em_event_rsvps
     WHERE org_id = ? AND event_id = ? ${statusClause}`,
    params
  );

  return { rows, total: Number(countRows[0].total) };
}

async function countByStatus(orgId, eventId) {
  const [rows] = await pool.execute(
    `SELECT response_status AS status, COUNT(*) AS count
     FROM client_em_event_rsvps
     WHERE org_id = ? AND event_id = ?
     GROUP BY response_status`,
    [orgId, eventId]
  );
  const counts = { going: 0, maybe: 0, not_going: 0 };
  for (const row of rows) counts[row.status] = Number(row.count);
  return counts;
}

module.exports = { findRsvpByEventAndUser, countGoingRsvps, upsertRsvp, listRsvpsByEvent, countByStatus };

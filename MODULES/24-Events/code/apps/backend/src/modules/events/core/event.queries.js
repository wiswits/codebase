'use strict';
const { pool } = require('../../../config/db');
const { BRANCH_SQL, pushBranchFilter } = require('../../../utils/activeSchool');

const SELECT_FIELDS = `
  id,
  org_id AS orgId,
  school_id AS schoolId,
  academic_year_id AS academicYearId,
  title,
  description,
  event_type AS eventType,
  category,
  color,
  start_datetime AS startDatetime,
  end_datetime AS endDatetime,
  all_day AS allDay,
  location,
  capacity,
  rsvp_enabled AS rsvpEnabled,
  rsvp_required AS rsvpRequired,
  rsvp_deadline AS rsvpDeadline,
  status,
  archived_at AS archivedAt,
  deleted_at AS deletedAt,
  gallery_album_id AS galleryAlbumId,
  created_by AS createdBy,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

// Which shelf of the board a list request is asking for. `active` is the only
// thing a non-manager ever sees — archived and binned events are the manager's
// housekeeping, not news for the school.
const VIEW_CLAUSES = {
  active:   'archived_at IS NULL AND deleted_at IS NULL',
  archived: 'archived_at IS NOT NULL AND deleted_at IS NULL',
  deleted:  'deleted_at IS NOT NULL',
};

async function listEvents(orgId, { search, status, startDate, endDate, page, limit, publishedOnly, userId, view, schoolId }) {
  const offset = (page - 1) * limit;

  // Unknown/absent view falls back to `active`, so a typo can never widen what
  // is shown to include the bin.
  const conditions = ['org_id = ?', VIEW_CLAUSES[view] || VIEW_CLAUSES.active];
  const params = [orgId];

  // A branch-bound admin sees their own campus plus anything the organisation
  // put on for everyone (school_id IS NULL) — Founders Day belongs on every
  // board, the Branch B sports day does not.
  pushBranchFilter(conditions, params, schoolId);

  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }
  if (publishedOnly) {
    // Non-managers (teacher/student/parent, and any role without events.manage)
    // never see a DRAFT — enforced server-side, never trusting the client.
    //
    // WW-83: this used to be `status = 'published'`, which also hid `scheduled`,
    // `completed` and `cancelled`. So JD PUBLIC's teachers opened Events, saw
    // "No events yet", and reported it — the school's one event was there the
    // whole time, just not in the single status this line allowed. Every status
    // except draft is news the school needs: scheduled is what you plan around,
    // cancelled is what stops you planning, completed is the record it happened.
    // The card already renders each status with its own badge.
    conditions.push("status <> 'draft'");
  } else if (status) {
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

  // pool.query (not execute) for the paginated SELECT: mysql2's prepared-statement
  // protocol rejects `LIMIT ?/OFFSET ?` on some engines (ER_WRONG_ARGUMENTS).
  // query() still escapes the `?` params — injection-safe, portable across
  // MariaDB (prod) and MySQL (local).
  // Correlated subquery surfaces the CURRENT user's own RSVP so the self-RSVP UI
  // reflects state on load. Its `?` is the first param, before the WHERE params.
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS},
       (SELECT response_status FROM client_em_event_rsvps
         WHERE org_id = client_em_events.org_id
           AND event_id = client_em_events.id
           AND user_id = ?) AS myRsvp
     FROM client_em_events
     WHERE ${whereClause}
     ORDER BY start_datetime ASC
     LIMIT ? OFFSET ?`,
    [userId || 0, ...params, limit, offset]
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM client_em_events WHERE ${whereClause}`,
    params
  );

  return { rows, total: Number(countRows[0].total) };
}

async function findEventById(orgId, eventId, schoolId = null) {
  // Knowing the id must not defeat the filter: this is the read every write
  // below gates on, so the branch predicate lives here rather than being
  // repeated at each call site.
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS}
     FROM client_em_events
     WHERE id = ? AND org_id = ? AND ${BRANCH_SQL}
     LIMIT 1`,
    [eventId, orgId, schoolId, schoolId]
  );
  return rows[0] || null;
}

async function createEvent(data, orgId, userId, schoolId = null) {
  // Stamped with the branch the request resolved to, and nothing else. A
  // caller who is not branch-bound leaves NULL, which reads as "the whole
  // organisation" — deliberately, rather than guessing at the primary campus
  // and quietly hiding the event from every other one.
  //
  // `academic_year_id` is resolved in the INSERT rather than by the caller: the
  // session a date belongs to is the session whose span CONTAINS it, which is a
  // fact about the data and not a choice the UI should be asked to make. Where
  // no session covers the date the subquery yields NULL, and the product reads
  // "not linked to a session" — we do not have that answer, so we do not invent
  // one. Same rule as the backfill in migration 047, deliberately, so a row
  // created today and a row backfilled yesterday agree.
  const [result] = await pool.execute(
    `INSERT INTO client_em_events
      (org_id, school_id, academic_year_id, title, description, event_type, category, color,
       start_datetime, end_datetime, all_day,
       location, capacity, rsvp_enabled, rsvp_required, rsvp_deadline, status, created_by)
     VALUES (?, ?,
       (SELECT ay.id FROM academic_years ay
         WHERE ay.org_id = ? AND DATE(?) BETWEEN ay.start_date AND ay.end_date
         ORDER BY ay.is_current DESC, ay.id ASC LIMIT 1),
       ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orgId,
      schoolId,
      orgId,
      data.startDatetime,
      data.title,
      data.description || null,
      data.eventType || null,
      data.category || 'event',
      data.color || null,
      data.startDatetime,
      data.endDatetime,
      data.allDay ? 1 : 0,
      data.location || null,
      data.capacity ?? null,
      data.rsvpEnabled === undefined ? 1 : (data.rsvpEnabled ? 1 : 0),
      data.rsvpRequired ? 1 : 0,
      data.rsvpDeadline || null,
      data.status || 'draft',
      userId || null,
    ]
  );
  return findEventById(orgId, result.insertId, schoolId);
}

async function updateEvent(eventId, data, orgId, schoolId = null) {
  const allowedFields = {
    title: 'title',
    description: 'description',
    eventType: 'event_type',
    category: 'category',
    color: 'color',
    startDatetime: 'start_datetime',
    endDatetime: 'end_datetime',
    allDay: 'all_day',
    location: 'location',
    capacity: 'capacity',
    rsvpEnabled: 'rsvp_enabled',
    rsvpRequired: 'rsvp_required',
    rsvpDeadline: 'rsvp_deadline',
    status: 'status',
  };

  // TINYINT(1) columns take 1/0, never `true`/`false` — the driver would send
  // those as the strings 'true'/'false' and MySQL stores 0 for both.
  const BOOLEAN_FIELDS = new Set(['rsvpEnabled', 'rsvpRequired', 'allDay']);

  const updates = [];
  const params = [];
  for (const [key, column] of Object.entries(allowedFields)) {
    // `undefined` means the caller did not mention this field, which means
    // "leave it alone". The update schema no longer injects create-time
    // defaults, so this test now means what it says — see event.validation.js.
    if (data[key] !== undefined) {
      updates.push(`${column} = ?`);
      params.push(BOOLEAN_FIELDS.has(key) ? (data[key] ? 1 : 0) : data[key]);
    }
  }

  if (updates.length === 0) {
    return findEventById(orgId, eventId, schoolId);
  }

  params.push(eventId, orgId, schoolId, schoolId);

  const [result] = await pool.execute(
    `UPDATE client_em_events
     SET ${updates.join(', ')}
     WHERE id = ? AND org_id = ? AND ${BRANCH_SQL}`,
    params
  );

  if (result.affectedRows === 0) return null;
  return findEventById(orgId, eventId, schoolId);
}

async function updateEventStatus(eventId, status, orgId, schoolId = null) {
  const [result] = await pool.execute(
    `UPDATE client_em_events
     SET status = ?
     WHERE id = ? AND org_id = ? AND ${BRANCH_SQL}`,
    [status, eventId, orgId, schoolId, schoolId]
  );
  if (result.affectedRows === 0) return null;
  return findEventById(orgId, eventId, schoolId);
}

/**
 * Move an event between the three shelves: active · archived · deleted.
 *
 * Every transition is expressible as one pair of timestamps, so this is one
 * UPDATE rather than three endpoints:
 *   active   → both NULL           (restore, from either shelf, straight back
 *                                   onto the board — "Restore" that made a card
 *                                   vanish into the archive instead would just
 *                                   read as a second disappearance)
 *   archived → archived_at = NOW() (and out of the bin, if it was in it)
 *   deleted  → deleted_at  = NOW() (archived_at untouched, so the record of
 *                                   when it was first shelved survives)
 *
 * COALESCE, not a bare NOW(): archiving something already archived must not
 * silently rewrite the date the school shelved it.
 *
 * Never a DELETE. §15: mark → migrate → remove, and "remove" is not a button a
 * school gets to press on its own history.
 */
async function updateEventLifecycle(eventId, state, orgId, schoolId = null) {
  const SETTERS = {
    active:   'archived_at = NULL, deleted_at = NULL',
    archived: 'archived_at = COALESCE(archived_at, NOW()), deleted_at = NULL',
    deleted:  'deleted_at = COALESCE(deleted_at, NOW())',
  };
  const set = SETTERS[state];
  if (!set) return null;

  // Existence is decided by a READ, not by affectedRows. The pool does not set
  // CLIENT_FOUND_ROWS, so affectedRows counts rows CHANGED — and archiving an
  // already-archived event changes nothing, which would have been reported to
  // the school as "Event not found" for an event sitting right there. Asking
  // for the state something is already in is a no-op, not an error.
  const existing = await findEventById(orgId, eventId, schoolId);
  if (!existing) return null;

  await pool.execute(
    `UPDATE client_em_events SET ${set} WHERE id = ? AND org_id = ? AND ${BRANCH_SQL}`,
    [eventId, orgId, schoolId, schoolId]
  );
  return findEventById(orgId, eventId, schoolId);
}

module.exports = { listEvents, findEventById, createEvent, updateEvent, updateEventStatus, updateEventLifecycle };

const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { userCan } = require('../../middleware/rbac');
const logger = require('../../utils/logger');
// ONE definition of announcement visibility/targeting — utils/announcementTargeting.js
const { announcementFeedSql } = require('../../utils/announcementTargeting');
// ONE definition of the branch predicate — utils/activeSchool.js
const { getActiveSchool, pushBranchFilter } = require('../../utils/activeSchool');
// ONE definition of "which days does this occupy" — utils/daySpan.js
const { daySpan } = require('../../utils/daySpan');

router.use(authenticate);

/*
 * ── EVENTS ON THE CALENDAR (WW-129) ────────────────────────────────────────
 *
 * The Calendar aggregated announcements, exams, fee instalments and attendance
 * sessions — and NEITHER events table. So a school created its Annual Day in
 * Events, opened the Calendar, and found the day empty. That is WW-129, and it
 * is the single loudest complaint about this product.
 *
 * `client_em_events` is the spine (docs/process/EVENTS_ACTIVITIES_PLAN.md §1):
 * it holds the times, the RSVPs, the resources and the lifecycle. The legacy
 * `client_events` table is NOT read here — it has no time, one section, and its
 * only live reader is Gallery, which is parked. Adding it as a second source
 * would put the same school event on the calendar twice under two ids.
 *
 * The colour a day is drawn in is decided HERE rather than stored per row, so a
 * school that never opens the colour picker still gets a calendar it can read
 * at a glance. A row's own `color` (migration 047) overrides it.
 */
const CATEGORY_COLOR = {
  event:    '#6366F1', // indigo — annual day, PTM, prize distribution
  activity: '#06B6D4', // cyan   — clubs, workshops, competitions
  festival: '#EC4899', // pink   — Diwali, Holi, founder's day
  holiday:  '#EF4444', // red    — declared holidays, vacations, closures
  academic: '#8B5CF6', // violet — unit tests, practicals, submission deadlines
};
// Deliberately distinct from the four colours already on this calendar:
// announcement #3b82f6 · exam #f59e0b · fee_due #ef4444 (never rendered) ·
// class #10b981. A palette that repeats is a legend nobody can use.

/**
 * The school's events, already expanded across every day they occupy.
 *
 * @param {number} orgId
 * @param {string} start 'YYYY-MM-DD' first day the caller is drawing
 * @param {string} end   'YYYY-MM-DD' last day
 * @param {number|null} schoolId resolved branch, or null for "not scoped"
 * @param {boolean} canManage may the caller see DRAFTS?
 */
async function eventsInRange(orgId, start, end, schoolId, canManage) {
  const conditions = ['org_id = ?', 'archived_at IS NULL', 'deleted_at IS NULL'];
  const params = [orgId];

  // A branch-bound admin sees their own campus plus whatever the organisation
  // put on for everyone (school_id IS NULL).
  pushBranchFilter(conditions, params, schoolId);

  // Exactly the rule the Events module itself applies (event.service.js): a
  // draft is not news, everything else is — scheduled is what you plan around,
  // cancelled is what stops you planning, completed is the record it happened.
  // Two screens disagreeing about who may see a draft is how a half-planned
  // event reaches a parent.
  if (!canManage) conditions.push("status <> 'draft'");

  // OVERLAP, not containment. An event that started in July and runs into
  // August belongs on August's grid; `start_datetime BETWEEN ? AND ?` would
  // drop it entirely, which is the same bug as showing a three-day event on
  // one day, just less visible.
  conditions.push('DATE(start_datetime) <= ? AND DATE(end_datetime) >= ?');
  params.push(end, start);

  // DATE_FORMAT, not DATE(): it returns a string whatever the driver's
  // `dateStrings` setting is, so the day can never arrive as a JS Date and get
  // named after the day before by a UTC round-trip (WW-130). Production runs
  // UTC while every DATETIME here is IST wall clock — see config/db.js.
  const rows = await query(
    `SELECT id, title, description, category, color, all_day AS allDay, status,
            location,
            DATE_FORMAT(start_datetime, '%Y-%m-%d') AS startDay,
            DATE_FORMAT(end_datetime,   '%Y-%m-%d') AS endDay,
            DATE_FORMAT(start_datetime, '%h:%i %p') AS startTime,
            DATE_FORMAT(end_datetime,   '%h:%i %p') AS endTime
       FROM client_em_events
      WHERE ${conditions.join(' AND ')}
      ORDER BY start_datetime
      LIMIT 200`, params);

  // One row per DAY the event occupies. `id` stays the event's id so the client
  // can still open it; the day is what makes each entry unique on the grid, so
  // callers key on type + id + date.
  return (rows || []).flatMap((e) => {
    const allDay = Number(e.allDay) === 1;
    return daySpan(e.startDay, e.endDay, start, end).map((date) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date,
      type: 'event',
      category: e.category || 'event',
      // A row's own colour wins; otherwise the category's. An unknown category
      // (a value written before this list grew) still gets a colour rather than
      // an undefined that renders as a transparent chip.
      color: e.color || CATEGORY_COLOR[e.category] || CATEGORY_COLOR.event,
      allDay,
      // A holiday has no clock, so it is given no time to show. Sending "12:00
      // AM – 12:00 AM" and asking the client to hide it is how the client ends
      // up with its own opinion about what all-day means.
      startTime: allDay ? null : e.startTime,
      endTime: allDay ? null : e.endTime,
      location: e.location || null,
      status: e.status,
      // A multi-day event says so, so the day panel can read "day 2 of 3"
      // rather than repeating an identical card three times.
      spanStart: e.startDay,
      spanEnd: e.endDay,
    }));
  });
}

router.get('/events', async (req, res) => {
  try {
    const o = req.user.org_id;
    const start = req.query.start || req.query.month_start || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const end = req.query.end || req.query.month_end || new Date(new Date().setMonth(new Date().getMonth()+1, 0)).toISOString().split('T')[0];

    // Fee-due rows include another family's student name — finance/staff only.
    // Everything else on this calendar (announcements/exams/sessions) is
    // legitimately org-wide, so only this one branch needs gating.
    const FINANCE_ROLES = ['owner','admin','principal','accountant','super_admin','system_admin'];
    const canSeeFeeDues = FINANCE_ROLES.includes((req.user.role_slug || '').toLowerCase());

    const annVis = announcementFeedSql('a', req.user.role_slug || req.user.role);

    // Resolved once, before the fan-out: both are per-request facts, and asking
    // for them inside Promise.all would run them for every source.
    const [schoolId, canManageEvents] = await Promise.all([
      getActiveSchool(req),
      userCan(req.user.user_id, 'events.manage', req.user.org_id).catch(() => false),
    ]);

    const [announcements, exams, feeDues, sessions, schoolEvents] = await Promise.all([
      // FIX: body → content
      // Role-targeted like the inbox — the calendar used to show EVERY announcement
      // to every role (a staff-only notice leaked onto student/parent calendars).
      query(`SELECT a.id, a.title, a.content as description, COALESCE(a.scheduled_at, a.created_at) as date, 'announcement' as type, '#3b82f6' as color
        FROM announcements a WHERE a.org_id=? AND ${annVis.sql}
          AND DATE(COALESCE(a.scheduled_at, a.created_at)) BETWEEN ? AND ?
        ORDER BY COALESCE(a.scheduled_at, a.created_at)`, [o, ...annVis.params, start, end]).catch(()=>[]),

      query(`SELECT id, name as title, exam_type as description, start_date as date, 'exam' as type, '#f59e0b' as color
        FROM client_exams WHERE org_id=? AND start_date BETWEEN ? AND ?`, [o, start, end]).catch(()=>[]),

      // "Fee due" on a calendar, finally meaning it.
      //
      // This carried the comment "FIX: due_date doesn't exist → use
      // assigned_date as proxy" — so a fee assigned in April showed as due in
      // April no matter when it was actually payable, and a MONTHLY fee showed
      // one marker for the year instead of twelve. It also filtered on
      // `fa.status IN ('pending','partial','overdue')`, a column nothing ever
      // updated, so every row read 'pending' and children who had paid in full
      // kept a red "Fee due" marker on the family calendar forever.
      //
      // Both are fixed at the source: the date comes from the instalment
      // schedule (migration 045), and whether it is still owed is derived from
      // the money rather than from a stale flag. Each unpaid instalment is its
      // own marker, which is what a parent on a monthly plan expects to see.
      !canSeeFeeDues ? Promise.resolve([]) : query(`SELECT fi.id,
        CONCAT('Fee due: ', COALESCE(fs.name,'Fee'), ' · ', COALESCE(fi.label,'')) as title,
        CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) as description,
        fi.due_date as date, 'fee_due' as type, '#ef4444' as color
        FROM client_fee_installments fi
        JOIN client_fee_assignments fa ON fa.id=fi.fee_assignment_id
        LEFT JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
        LEFT JOIN client_students s ON s.id=fa.student_id
        LEFT JOIN client_users u ON u.id=s.user_id
        WHERE fi.org_id=?
          AND fa.final_amount > (SELECT COALESCE(SUM(p.amount),0) FROM client_fee_payments p
                                  WHERE p.fee_assignment_id=fa.id AND p.status='completed')
          AND fi.due_date BETWEEN ? AND ?
        ORDER BY fi.due_date
        LIMIT 50`, [o, start, end]).catch(()=>[]),

      // FIX: topic doesn't exist → use notes or generated title
      query(`SELECT id, CONCAT('Class session #', id) as title,
        notes as description, date as date, 'class' as type, '#10b981' as color
        FROM client_attendance_sessions WHERE org_id=? AND date BETWEEN ? AND ?
        LIMIT 100`, [o, start, end]).catch(()=>[]),

      // WW-129 — the school's own events, activities, festivals, holidays and
      // academic dates. Already carries its own `date` per day it spans, so it
      // does NOT go through fmtDate below.
      eventsInRange(o, start, end, schoolId, canManageEvents).catch((e) => {
        // A swallowed error here would render as "no events", which is
        // indistinguishable from a school that has none — the exact reason
        // WW-129 took so long to be believed. The other four sources predate
        // this rule; this one is not allowed to fail silently.
        logger.error('Calendar events source (client_em_events):', e);
        return [];
      })
    ]);

    const fmtDate = (d) => {
      if (!d) return null;
      if (d.toISOString) return d.toISOString().split('T')[0];
      return String(d).split('T')[0].split(' ')[0];
    };

    const events = [
      ...(announcements||[]).map(e=>({...e, date: fmtDate(e.date)})),
      ...(exams||[]).map(e=>({...e, date: fmtDate(e.date)})),
      ...(feeDues||[]).map(e=>({...e, date: fmtDate(e.date)})),
      ...(sessions||[]).map(e=>({...e, date: fmtDate(e.date)})),
      // Already 'YYYY-MM-DD', computed in the database's own timezone and
      // expanded per day. Passing it through fmtDate would re-introduce exactly
      // the UTC round-trip daySpan.js exists to avoid.
      ...schoolEvents
    ].filter(e=>e.date);

    return success(res, { events, range: { start, end }, count: events.length });
  } catch (e) { logger.error('Calendar events:', e); return error(res, e.message, 500); }
});

router.get('/stats', async (req, res) => {
  try {
    const o = req.user.org_id;
    const month_start = req.query.month_start || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const month_end = req.query.month_end || new Date(new Date().setMonth(new Date().getMonth()+1, 0)).toISOString().split('T')[0];
    const annVis = announcementFeedSql('a', req.user.role_slug || req.user.role);
    const [schoolId, canManageEvents] = await Promise.all([
      getActiveSchool(req),
      userCan(req.user.user_id, 'events.manage', req.user.org_id).catch(() => false),
    ]);

    const [a, e, f, s, ev] = await Promise.all([
      // Count must use the SAME visibility rule as /events, or the month badge
      // disagrees with the dots on the grid.
      queryOne(`SELECT COUNT(*) as cnt FROM announcements a WHERE a.org_id=? AND ${annVis.sql}
        AND DATE(COALESCE(a.scheduled_at, a.created_at)) BETWEEN ? AND ?`, [o, ...annVis.params, month_start, month_end]).catch(()=>({cnt:0})),
      queryOne(`SELECT COUNT(*) as cnt FROM client_exams WHERE org_id=? AND start_date BETWEEN ? AND ?`, [o, month_start, month_end]).catch(()=>({cnt:0})),
      // FIX: due_date doesn't exist → assigned_date
      queryOne(`SELECT COUNT(*) as cnt FROM client_fee_assignments WHERE org_id=? AND assigned_date BETWEEN ? AND ?`, [o, month_start, month_end]).catch(()=>({cnt:0})),
      queryOne(`SELECT COUNT(*) as cnt FROM client_attendance_sessions WHERE org_id=? AND date BETWEEN ? AND ?`, [o, month_start, month_end]).catch(()=>({cnt:0})),
      // Counted through the SAME function that draws them, for the reason this
      // file already states above: a badge computed by a second query with a
      // second set of filters will eventually disagree with the dots on the
      // grid, and then neither number can be trusted. This counts EVENTS, not
      // day-cells, so a three-day meet is one event in the badge and three
      // marks on the month.
      eventsInRange(o, month_start, month_end, schoolId, canManageEvents)
        .then((rows) => new Set(rows.map((r) => r.id)).size)
        .catch(() => 0)
    ]);

    return success(res, {
      announcements: a?.cnt || 0,
      exams: e?.cnt || 0,
      fee_dues: f?.cnt || 0,
      class_sessions: s?.cnt || 0,
      events: ev || 0,
      total: (a?.cnt||0) + (e?.cnt||0) + (f?.cnt||0) + (s?.cnt||0) + (ev||0)
    });
  } catch (e) { logger.error('Calendar stats:', e); return error(res, e.message, 500); }
});

module.exports = router;

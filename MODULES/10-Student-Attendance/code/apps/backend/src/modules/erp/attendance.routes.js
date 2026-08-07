const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error }  = require('../../utils/response');
const { authenticate }    = require('../../middleware/auth');
const { requireModule }   = require('../../middleware/moduleGate');
const { requirePermission } = require('../../middleware/rbac');
const { getActiveSchool } = require('../../utils/activeSchool');
// ONE definition of "a child who is on the register" — see utils/headcount.js.
const { activeEnrolment } = require('../../utils/headcount');
const logger = require('../../utils/logger');

router.use(authenticate);

// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('attendance'));
// SUG-0025 §2 — attendance date policy. The "same day" is the school-timezone
// (IST, Asia/Kolkata) calendar day. Teachers may enter/edit only the current
// day's attendance; it locks at IST midnight. Admin/Principal can correct a
// past/locked day (audited). Future dates are never allowed.
// ONE definition of that day for the whole platform — utils/schoolDay.js. This
// file used to own a private copy while the aggregate endpoints below used the
// UTC day, which is what made the admin dashboard report yesterday's twelve
// present students as "present today" while the teacher screen showed all 24
// unmarked (QA rounds 7-8).
const { istToday } = require('../../utils/schoolDay');
// ONE rule for "count → percentage": null when nothing was marked, never 0%,
// never 100% — utils/pct.js.
const { safePct } = require('../../utils/pct');
// ONE definition of "attendance %" (unit, numerator, denominator, scope naming)
// shared with the student portal and every dashboard — utils/attendanceStats.js.
const { STAT_COLS_SQL, PRESENT_PCT_SQL, normalizeStats } = require('../../utils/attendanceStats');

// A student may read only their OWN attendance; a parent only a linked child;
// staff anyone. Prevents iterating studentId to read any classmate's
// attendance history (was an IDOR).
const { teacherTeachesStudent, teacherTeachesSection } = require('../../middleware/teacherScope');
const ATT_STAFF = ['owner', 'admin', 'principal', 'coordinator', 'hod', 'super_admin', 'system_admin'];
// SUG-0021: writing attendance for a section is staff-wide; a teacher must
// actually teach that section. Returns boolean (caller sends the 403).
async function canWriteSectionAttendance(user, sectionId, orgId) {
  if (ATT_STAFF.includes(user.role_slug)) return true;
  if (user.role_slug === 'teacher') return teacherTeachesSection(orgId, user.user_id, sectionId);
  return false;
}
async function canViewStudentAttendance(user, studentId, orgId) {
  if (ATT_STAFF.includes(user.role_slug)) return true;
  if (user.role_slug === 'teacher') return teacherTeachesStudent(orgId, user.user_id, studentId);
  if (user.role_slug === 'student') {
    const self = await queryOne('SELECT 1 FROM client_students WHERE id=? AND org_id=? AND user_id=?', [studentId, orgId, user.user_id]);
    return !!self;
  }
  if (user.role_slug === 'parent') {
    const parent = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [orgId, user.user_id]);
    if (!parent) return false;
    const link = await queryOne('SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'', [parent.id, studentId]);
    return !!link;
  }
  return false;
}

// ═══ DASHBOARD / STATS ═══
router.get('/dashboard', requirePermission('attendance.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    // IST day — the same day the teacher marking screen writes to.
    const today = istToday();
    // multi-branch: scope every aggregate to the active branch (null → org-wide, unchanged)
    const activeSchool = await getActiveSchool(req);
    const secFilter = activeSchool ? ' AND sec.school_id=?' : '';
    const secJoin   = activeSchool ? ' JOIN client_sections sec ON sec.id=s.section_id' : '';

    // total_marked = distinct STUDENTS with a record today (drives "Not marked").
    // marked_records = the number of records — the ONLY honest denominator for
    // the present %, since a student can have more than one session in a day
    // (class + exam). Dividing a record count by a student count printed >100%.
    const today_stats = await queryOne(`
      SELECT
        COUNT(DISTINCT ar.student_id) total_marked,
        COUNT(ar.id) marked_records,
        SUM(ar.status='present') present,
        SUM(ar.status='absent')  absent,
        SUM(ar.status='late')    late,
        SUM(ar.status='excused') excused
      FROM client_attendance_records ar
      JOIN client_attendance_sessions s ON s.id=ar.session_id${secJoin}
      WHERE ar.org_id=? AND s.date=?${secFilter}`,
      activeSchool ? [orgId, today, activeSchool] : [orgId, today]);

    const total_students = await queryOne(`
      SELECT COUNT(*) cnt FROM client_students s
      JOIN client_users u ON u.id=s.user_id
      WHERE s.org_id=? AND u.is_active=1${activeSchool ? ' AND s.school_id=?' : ''}`,
      activeSchool ? [orgId, activeSchool] : [orgId]);

    const sessions_today = await queryOne(
      `SELECT COUNT(*) cnt FROM client_attendance_sessions s WHERE org_id=? AND date=?${
        activeSchool ? ' AND section_id IN (SELECT id FROM client_sections WHERE school_id=?)' : ''}`,
      activeSchool ? [orgId, today, activeSchool] : [orgId, today]);

    // Recent sessions
    const recent = await query(`
      SELECT s.*, c.name class_name, sec.name section_name,
        COUNT(DISTINCT ar.student_id) total,
        SUM(ar.status='present') present,
        SUM(ar.status='absent') absent
      FROM client_attendance_sessions s
      LEFT JOIN client_sections sec ON sec.id=s.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      LEFT JOIN client_attendance_records ar ON ar.session_id=s.id
      WHERE s.org_id=?${secFilter}
      GROUP BY s.id
      ORDER BY s.date DESC, s.id DESC LIMIT 10`,
      activeSchool ? [orgId, activeSchool] : [orgId]);

    return success(res, {
      today: {
        date: today,
        total_marked: Number(today_stats.total_marked) || 0,
        marked_records: Number(today_stats.marked_records) || 0,
        present: Number(today_stats.present) || 0,
        absent: Number(today_stats.absent) || 0,
        late: Number(today_stats.late) || 0,
        excused: Number(today_stats.excused) || 0,
        total_students: total_students.cnt || 0,
        not_marked: Math.max(0, (total_students.cnt || 0) - (Number(today_stats.total_marked) || 0)),
        sessions: sessions_today.cnt || 0,
        // NULL — not 0, not 100 — when nothing has been marked yet. The UI
        // renders "Not marked yet" for null (utils/pct.js).
        attendance_pct: safePct(today_stats.present, today_stats.marked_records),
      },
      recent_sessions: recent,
    });
  } catch (e) { return error(res, e.message, 500); }
});

// Today snapshot for dashboard
router.get('/today', requirePermission('attendance.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const today = istToday();
    const activeSchool = await getActiveSchool(req);
    const rows = await query(`
      SELECT ar.status, COUNT(*) cnt
      FROM client_attendance_records ar
      JOIN client_attendance_sessions s ON s.id=ar.session_id${
        activeSchool ? ' JOIN client_sections sec ON sec.id=s.section_id' : ''}
      WHERE ar.org_id=? AND s.date=?${activeSchool ? ' AND sec.school_id=?' : ''}
      GROUP BY ar.status`, activeSchool ? [orgId, today, activeSchool] : [orgId, today]);
    return success(res, { records: rows, date: today });
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ SESSIONS ═══
router.get('/sessions', requirePermission('attendance.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { date, section_id, class_id } = req.query;
    let where = 'WHERE s.org_id=?';
    const params = [orgId];
    if (date) { where += ' AND s.date=?'; params.push(date); }
    if (section_id) { where += ' AND s.section_id=?'; params.push(section_id); }
    if (class_id) { where += ' AND sec.class_id=?'; params.push(class_id); }
    const activeSchool = await getActiveSchool(req);
    if (activeSchool) { where += ' AND sec.school_id=?'; params.push(activeSchool); }

    const sessions = await query(`
      SELECT s.*, c.name class_name, sec.name section_name,
        CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) teacher_name,
        COUNT(DISTINCT ar.student_id) total,
        SUM(ar.status='present') present,
        SUM(ar.status='absent') absent,
        SUM(ar.status='late')   late,
        SUM(ar.status='excused') excused
      FROM client_attendance_sessions s
      LEFT JOIN client_sections sec ON sec.id=s.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      LEFT JOIN client_users u ON u.id=s.marked_by
      LEFT JOIN client_attendance_records ar ON ar.session_id=s.id
      ${where}
      GROUP BY s.id
      ORDER BY s.date DESC, s.id DESC LIMIT 100`, params);
    return success(res, { sessions });
  } catch (e) { return error(res, e.message, 500); }
});

// Get or create session — used before marking
router.post('/sessions/get-or-create', requirePermission('attendance.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const { section_id, date, session_type='class' } = req.body;
    if (!section_id || !date) return error(res, 'section_id and date required', 400);
    if (!(await canWriteSectionAttendance(req.user, section_id, orgId))) return error(res, 'Forbidden', 403);

    const today = istToday();
    const isElevated = ATT_STAFF.includes(req.user.role_slug);
    if (date > today) return error(res, 'Attendance cannot be taken for a future date.', 400);

    let session = await queryOne(
      'SELECT * FROM client_attendance_sessions WHERE org_id=? AND section_id=? AND date=? AND session_type=? LIMIT 1',
      [orgId, section_id, date, session_type]);

    if (!session) {
      // A new session for a past day may only be created by an admin (correction).
      if (date < today && !isElevated) {
        return error(res, 'Attendance for past dates is locked. Please ask an admin to make a correction.', 403);
      }
      const r = await query(
        'INSERT INTO client_attendance_sessions (org_id, section_id, date, session_type, marked_by) VALUES (?,?,?,?,?)',
        [orgId, section_id, date, session_type, userId]);
      session = await queryOne('SELECT * FROM client_attendance_sessions WHERE id=?', [r.insertId]);
    }

    // Whether THIS user may still edit: elevated always; teacher only on the
    // current IST day and while the session is not explicitly locked.
    const canEdit = isElevated || (date === today && !session.locked);

    // Load roster (active students in section) and their existing records.
    // Auto-sync: if a student has an APPROVED leave covering this date and no
    // explicit record yet, pre-fill their status as 'leave' (SUG teacher req).
    const roster = await query(`
      SELECT s.id student_id, u.first_name, u.last_name, u.email, s.admission_number,
        COALESCE(ar.status, IF(lv.id IS NOT NULL, 'leave', NULL)) AS status,
        ar.remarks,
        (lv.id IS NOT NULL) AS on_leave
      FROM client_enrollments e
      JOIN client_students s ON s.id=e.student_id
      JOIN client_users u ON u.id=s.user_id
      LEFT JOIN client_attendance_records ar ON ar.session_id=? AND ar.student_id=s.id
      LEFT JOIN client_leave_requests lv
        ON lv.org_id=? AND lv.student_id=s.id AND lv.status='approved'
        AND ? BETWEEN lv.from_date AND lv.to_date
      WHERE e.section_id=? AND e.status='active' AND u.is_active=1
      ORDER BY u.first_name`, [session.id, orgId, date, section_id]);

    return success(res, { session, roster, canEdit, today, isElevated });
  } catch (e) { return error(res, e.message, 500); }
});

// Bulk mark attendance
router.post('/mark', requirePermission('attendance.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const { session_id, records=[] } = req.body;
    if (!session_id || !Array.isArray(records)) return error(res, 'session_id and records required', 400);

    const session = await queryOne(
      'SELECT *, DATE_FORMAT(date, "%Y-%m-%d") AS date_str FROM client_attendance_sessions WHERE id=? AND org_id=?',
      [session_id, orgId]);
    if (!session) return error(res, 'Session not found', 404);
    if (!(await canWriteSectionAttendance(req.user, session.section_id, orgId))) return error(res, 'Forbidden', 403);

    // Date-lock policy (SUG-0025 §2).
    const today = istToday();
    const sdate = session.date_str;
    const isElevated = ATT_STAFF.includes(req.user.role_slug);
    if (sdate > today) return error(res, 'Attendance cannot be marked for a future date.', 400);
    if (!isElevated) {
      if (sdate < today) return error(res, 'Attendance is locked after the day it was taken. Please ask an admin to make a correction.', 403);
      if (session.locked)  return error(res, 'This attendance is locked. Please ask an admin to make a correction.', 403);
    }
    // An elevated user editing a past/locked day is a correction → audit it.
    const isOverride = isElevated && (sdate < today || !!session.locked);

    let marked = 0;
    for (const r of records) {
      if (!r.student_id || !r.status) continue;
      const validStatus = ['present','absent','late','excused','leave'].includes(r.status) ? r.status : 'absent';
      // Upsert
      const existing = await queryOne(
        'SELECT id FROM client_attendance_records WHERE session_id=? AND student_id=?',
        [session_id, r.student_id]);
      if (existing) {
        await query(
          'UPDATE client_attendance_records SET status=?, remarks=?, marked_by=? WHERE id=?',
          [validStatus, r.remarks || null, userId, existing.id]);
      } else {
        await query(
          'INSERT INTO client_attendance_records (session_id, org_id, student_id, status, remarks, marked_by) VALUES (?,?,?,?,?,?)',
          [session_id, orgId, r.student_id, validStatus, r.remarks || null, userId]);
      }
      marked++;
    }

    // Update session marked timestamp
    await query('UPDATE client_attendance_sessions SET marked_at=NOW() WHERE id=?', [session_id]);

    if (isOverride) {
      logger.info('[AUDIT] attendance.override', {
        action: 'attendance_correction', orgId, userId, role: req.user.role_slug,
        session_id, section_id: session.section_id, date: sdate, marked,
      });
    }

    return success(res, { marked, override: isOverride }, `${marked} students marked`);
  } catch (e) { return error(res, e.message, 500); }
});

// Lock/unlock session
router.post('/sessions/:id/lock', requirePermission('attendance.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const { locked=true } = req.body;
    const session = await queryOne('SELECT section_id FROM client_attendance_sessions WHERE id=? AND org_id=?', [id, orgId]);
    if (!session) return error(res, 'Session not found', 404);
    if (!(await canWriteSectionAttendance(req.user, session.section_id, orgId))) return error(res, 'Forbidden', 403);
    await query('UPDATE client_attendance_sessions SET locked=? WHERE id=? AND org_id=?',
      [locked ? 1 : 0, id, orgId]);
    return success(res, {}, locked ? 'Locked' : 'Unlocked');
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ STUDENT MONTHLY VIEW ═══
router.get('/student/:studentId', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { studentId } = req.params;
    if (!(await canViewStudentAttendance(req.user, parseInt(studentId), orgId))) return error(res, 'Forbidden', 403);
    // `month` arrives two ways: "7" + year=2026 (Monthly View panel) and
    // "2026-07" (parent attendance page). parseInt("2026-07") is 2026, which
    // built the impossible range "2026-2026-01" and silently returned an EMPTY
    // calendar for every parent. Accept both forms.
    const { month, year } = req.query;
    const ym = /^(\d{4})-(\d{1,2})$/.exec(String(month || ''));
    const istNow = istToday();
    const m = ym ? parseInt(ym[2], 10) : (parseInt(month, 10) || parseInt(istNow.slice(5, 7), 10));
    const y = ym ? parseInt(ym[1], 10) : (parseInt(year, 10) || parseInt(istNow.slice(0, 4), 10));
    if (!(m >= 1 && m <= 12) || !(y >= 1970 && y <= 9999)) return error(res, 'Invalid month/year', 400);
    const from = `${y}-${String(m).padStart(2, '0')}-01`;
    // Last day of the month, computed in plain calendar arithmetic (Date+
    // toISOString would shift the boundary by the server's timezone).
    const to = `${y}-${String(m).padStart(2, '0')}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;

    const records = await query(`
      SELECT ar.*, s.date, s.session_type, sec.name section_name, c.name class_name
      FROM client_attendance_records ar
      JOIN client_attendance_sessions s ON s.id=ar.session_id
      LEFT JOIN client_sections sec ON sec.id=s.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      WHERE ar.student_id=? AND ar.org_id=? AND s.date BETWEEN ? AND ?
      ORDER BY s.date DESC`, [studentId, orgId, from, to]);

    // TWO explicitly-scoped summaries — never one number wearing two labels.
    // `summary` = ALL-TIME (the Monthly View panel prints it under "overall").
    // `monthly` = the month `records` covers (what a "This month" tile must use).
    // Both count ATTENDANCE RECORDS with the same NULLIF denominator, so they
    // are directly comparable and an empty scope yields NULL, never 0%/100%.
    const STAT_COLS = STAT_COLS_SQL('ar');
    const [overallRow, monthRow] = await Promise.all([
      queryOne(`
        SELECT ${STAT_COLS}
        FROM client_attendance_records ar
        JOIN client_attendance_sessions s ON s.id=ar.session_id
        WHERE ar.student_id=? AND ar.org_id=?`, [studentId, orgId]),
      queryOne(`
        SELECT ${STAT_COLS}
        FROM client_attendance_records ar
        JOIN client_attendance_sessions s ON s.id=ar.session_id
        WHERE ar.student_id=? AND ar.org_id=? AND s.date BETWEEN ? AND ?`,
        [studentId, orgId, from, to]),
    ]);
    const overall = normalizeStats(overallRow);
    const monthly = normalizeStats(monthRow);
    // `summary` is kept for the existing Monthly View panel, which labels it
    // "overall" — the honest scope. `percentage` is its legacy field name.
    const summary = { ...overall, percentage: overall.pct, excused: overall.leave };

    return success(res, { records, summary, overall, monthly, month: m, year: y, from, to });
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ REPORTS ═══
router.get('/reports/defaulters', requirePermission('attendance.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { min_pct=75, class_id, from_date, to_date } = req.query;

    let dateFilter = '';
    const params = [orgId, orgId];
    if (from_date) { dateFilter += ' AND s.date >= ?'; params.push(from_date); }
    if (to_date)   { dateFilter += ' AND s.date <= ?'; params.push(to_date); }
    
    let classFilter = '';
    if (class_id) { classFilter = ' AND sec.class_id=?'; params.push(class_id); }

    let branchFilter = '';
    const activeSchool = await getActiveSchool(req);
    if (activeSchool) { branchFilter = ' AND st.school_id=?'; params.push(activeSchool); }

    params.push(parseFloat(min_pct));

    const rows = await query(`
      SELECT st.id student_id, u.first_name, u.last_name, u.email, u.phone,
        st.admission_number, c.name class_name, sec.name section_name,
        COUNT(ar.id) total,
        SUM(ar.status='present') present,
        SUM(ar.status='absent') absent,
        ROUND(SUM(ar.status='present')/NULLIF(COUNT(ar.id),0)*100, 1) percentage
      FROM client_students st
      JOIN client_users u ON u.id=st.user_id
      LEFT JOIN client_enrollments e ON e.student_id=st.id AND e.status='active'
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      LEFT JOIN client_attendance_records ar ON ar.student_id=st.id AND ar.org_id=?
      LEFT JOIN client_attendance_sessions s ON s.id=ar.session_id
      WHERE st.org_id=? AND u.is_active=1 ${dateFilter} ${classFilter} ${branchFilter}
      GROUP BY st.id
      HAVING total > 0 AND percentage < ?
      ORDER BY percentage ASC`, params);

    return success(res, { defaulters: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/reports/class-wise', requirePermission('attendance.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { date = istToday() } = req.query;
    const activeSchool = await getActiveSchool(req);

    // The roster (client_enrollments) and the attendance records must NOT be
    // joined in the same GROUP BY: with 12 enrolled students and 12 records the
    // cross product yields 144 rows and SUM(status='present') reports 144
    // "present". Each side is aggregated in its own correlated subquery, so a
    // roster row can never be counted as attendance.
    const rows = await query(`
      SELECT c.id class_id, c.name class_name, sec.id section_id, sec.name section_name,
        -- Archived children are not on the register. Counting them here made the
        -- Class Status widget ask for 13 in a class of 11 (WW-122): the teacher
        -- marked every child present and the widget still said "2 pending",
        -- naming nobody, so 100% marked was unreachable from this screen.
        (SELECT COUNT(*) FROM client_enrollments e
          WHERE e.section_id=sec.id AND e.org_id=c.org_id AND ${activeEnrolment('e')}) total_students,
        COALESCE(m.marked_students, 0) marked,
        COALESCE(m.marked_records, 0)  marked_records,
        COALESCE(m.present, 0) present,
        COALESCE(m.absent, 0)  absent,
        COALESCE(m.late, 0)    late,
        m.pct
      FROM client_classes c
      JOIN client_sections sec ON sec.class_id=c.id AND sec.status='active'
      LEFT JOIN (
        SELECT s.section_id,
               COUNT(DISTINCT ar.student_id) marked_students,
               COUNT(ar.id) marked_records,
               SUM(ar.status='present') present,
               SUM(ar.status='absent')  absent,
               SUM(ar.status='late')    late,
               ${PRESENT_PCT_SQL('ar')} pct
          FROM client_attendance_sessions s
          JOIN client_attendance_records ar ON ar.session_id=s.id
         WHERE s.org_id=? AND s.date=?
         GROUP BY s.section_id
      ) m ON m.section_id=sec.id
      WHERE c.org_id=?${activeSchool ? ' AND c.school_id=?' : ''}
      GROUP BY c.id, sec.id
      ORDER BY COALESCE(c.display_order, c.standard*10), c.standard, c.name, sec.name`,
      activeSchool ? [orgId, date, orgId, activeSchool] : [orgId, date, orgId]);

    return success(res, { date, classes: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// GET /attendance/reports/section/:sectionId/trend?days=7
//
// The last N school days for ONE section — the "how is this class doing"
// question the class card asks. Returns only days that were actually MARKED:
// a day nobody took the register is absent from the series, not a 0%, because
// drawing 0% for an unmarked day accuses a class of not turning up.
//
// One row per date, so the caller draws real bars or an honest empty state.
router.get('/reports/section/:sectionId/trend', requirePermission('attendance.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { sectionId } = req.params;
    // Bounded on purpose: this feeds a small chart, not an export.
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 30);

    const sec = await queryOne(
      'SELECT id FROM client_sections WHERE id=? AND org_id=?', [sectionId, orgId]);
    if (!sec) return error(res, 'Section not found', 404);

    // A date window rather than LIMIT: `LIMIT ?` is not portable across our
    // MySQL-local / MariaDB-server split, and "the last 7 days" is the question
    // being asked anyway. Anchored to the IST school day, never the server's
    // clock — a UTC box would otherwise start the window a day early (KI-106).
    const rows = await query(
      `SELECT s.date, ${STAT_COLS_SQL('ar')}
         FROM client_attendance_sessions s
         JOIN client_attendance_records ar ON ar.session_id = s.id
        WHERE s.org_id = ? AND s.section_id = ?
          AND s.date > DATE_SUB(?, INTERVAL ? DAY) AND s.date <= ?
        GROUP BY s.date
        ORDER BY s.date`,
      [orgId, sectionId, istToday(), days, istToday()]);

    return success(res, { section_id: Number(sectionId), from_days: days, days: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ LEAVE REQUESTS ═══
router.get('/leaves', requirePermission('attendance.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { status } = req.query;
    let where = 'WHERE lr.org_id=?';
    const params = [orgId];
    if (status) { where += ' AND lr.status=?'; params.push(status); }
    // multi-branch: scope to the active branch via the student's branch (null → unchanged)
    const activeSchool = await getActiveSchool(req);
    if (activeSchool) { where += ' AND st.school_id=?'; params.push(activeSchool); }

    const rows = await query(`
      SELECT lr.*, u.first_name, u.last_name, u.email, st.admission_number,
        c.name class_name, sec.name section_name,
        CONCAT(COALESCE(au.first_name,''), ' ', COALESCE(au.last_name,'')) approver_name,
        DATEDIFF(lr.to_date, lr.from_date) + 1 days
      FROM client_leave_requests lr
      JOIN client_students st ON st.id=lr.student_id
      JOIN client_users u ON u.id=st.user_id
      LEFT JOIN client_enrollments e ON e.student_id=st.id AND e.status='active'
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      LEFT JOIN client_users au ON au.id=lr.approved_by
      ${where}
      ORDER BY lr.created_at DESC LIMIT 100`, params);

    return success(res, { leaves: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/leaves', requirePermission('attendance.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { student_id, from_date, to_date, reason, leave_type='personal' } = req.body;
    if (!student_id || !from_date || !to_date || !reason) return error(res, 'All fields required', 400);
    const r = await query(
      `INSERT INTO client_leave_requests (org_id, student_id, from_date, to_date, reason, leave_type, status) 
       VALUES (?,?,?,?,?,?,?)`,
      [orgId, student_id, from_date, to_date, reason, leave_type, 'pending']);
    return success(res, { id: r.insertId }, 'Leave request submitted', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/leaves/:id', requirePermission('attendance.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const { id } = req.params;
    const { status, remarks } = req.body;
    if (!['approved','rejected'].includes(status)) return error(res, 'Invalid status', 400);
    await query(
      'UPDATE client_leave_requests SET status=?, remarks=?, approved_by=?, approved_at=NOW() WHERE id=? AND org_id=?',
      [status, remarks||null, userId, id, orgId]);
    return success(res, {}, 'Updated');
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ CONFIG ═══
router.get('/config', requirePermission('attendance.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const cfg = await queryOne('SELECT * FROM client_attendance_config WHERE org_id=?', [orgId]);
    return success(res, { config: cfg || { working_days_mask: '1111110', min_attendance_pct: 75, late_grace_minutes: 10 } });
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/config', requirePermission('attendance.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { working_days_mask, min_attendance_pct, late_grace_minutes, auto_notify_absent, notify_after_days } = req.body;
    await query(
      `INSERT INTO client_attendance_config (org_id, working_days_mask, min_attendance_pct, late_grace_minutes, auto_notify_absent, notify_after_days)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE 
         working_days_mask=VALUES(working_days_mask),
         min_attendance_pct=VALUES(min_attendance_pct),
         late_grace_minutes=VALUES(late_grace_minutes),
         auto_notify_absent=VALUES(auto_notify_absent),
         notify_after_days=VALUES(notify_after_days)`,
      [orgId, working_days_mask||'1111110', min_attendance_pct||75, late_grace_minutes||10, auto_notify_absent?1:0, notify_after_days||2]);
    return success(res, {}, 'Config updated');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;

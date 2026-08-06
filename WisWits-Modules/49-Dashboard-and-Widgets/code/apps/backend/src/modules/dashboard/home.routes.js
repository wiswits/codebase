const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { getActiveSchool } = require('../../utils/activeSchool');
// ONE definition of "what this teacher is responsible for" — middleware/teacherScope.
// The teacher dashboard must agree with the gates that let the teacher in.
const { teacherSectionsSql } = require('../../middleware/teacherScope');
// One definition of "leave awaiting approval", shared with /widgets/insights and
// the Leaves module itself — so no two widgets can disagree about the count.
const { PENDING_LEAVE_SQL } = require('../hrms/leaves/leaveService');
// ONE definition of "a student's result percentage" + ONE rounding rule, shared
// with /assessments/my/results and Report Cards — see utils/examResult.js.
// An exam that cannot produce a report card must never produce a percentage.
const { RESULT_ELIGIBLE_SQL, MARK_COUNTED_SQL, WEIGHTED_PCT_COL } = require('../../utils/examResult');
// ONE definition of the school's calendar day (IST) — utils/schoolDay.js. The
// admin dashboard used MySQL CURDATE() (the SERVER's day, UTC in production)
// while the teacher marking screen wrote the IST day; after 18:30 UTC the two
// are different days, which is why "present_today: 12" appeared next to a fully
// unmarked class (QA rounds 7-8).
const { istToday } = require('../../utils/schoolDay');
// ONE definition of "attendance %" + ONE rounding rule — utils/attendanceStats.js.
const { STAT_COLS_SQL, normalizeStats, presentPct } = require('../../utils/attendanceStats');
const logger = require('../../utils/logger');

router.use(authenticate);
// Staff-only dashboards must not be reachable by a student/parent token
const ADMIN_DASH = ['owner', 'admin', 'principal', 'vice_principal', 'coordinator', 'academic_coordinator', 'hod', 'super_admin', 'system_admin'];

const dayMap = {0:'Sun',1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat'};

// All schools run on IST. The server may run UTC, where new Date().getDay()
// flips a day early/late around midnight — compute "today" in IST explicitly
// so dashboards agree with the browser-rendered timetable.
const todayKeyIST = () => dayMap[new Date(Date.now() + 5.5 * 3600 * 1000).getUTCDay()];

// ─── ADMIN: all-module summary ─────────────────────────────────────────────
router.get('/admin', requireRole(...ADMIN_DASH), async (req, res) => {
  try {
    const o = req.user.org_id;
    // The school's day, not the server's. Bound as a parameter everywhere below.
    const today = istToday();
    const monthStart = `${today.slice(0, 7)}-01`;
    // Multi-branch: resolve the active branch ONCE up front so the recent-activity
    // lists below are branch-scoped too (the headline counts are overridden later).
    const activeSchool = await getActiveSchool(req);

    const [counts] = await Promise.all([
      queryOne(`
        SELECT
          (SELECT COUNT(*) FROM client_students s JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id WHERE s.org_id=? AND u.is_active=1) AS total_students,
          (SELECT COUNT(*) FROM client_users u WHERE u.org_id=? AND u.is_active=1 AND EXISTS (
             SELECT 1 FROM client_user_roles ur JOIN client_roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.base_role='teacher'
          )) AS total_teachers,
          (SELECT COUNT(DISTINCT u.id) FROM client_users u
             JOIN client_user_roles ur ON ur.user_id=u.id
             JOIN client_roles r ON r.id=ur.role_id
             WHERE u.org_id=? AND u.is_active=1 AND r.base_role NOT IN ('student','parent')
          ) AS total_staff,
          (SELECT COUNT(*) FROM client_parents WHERE org_id=?) AS total_parents,
          (SELECT COUNT(*) FROM client_classes WHERE org_id=?) AS total_classes,
          (SELECT COUNT(*) FROM client_sections WHERE org_id=?) AS total_sections,
          (SELECT COUNT(*) FROM client_exams WHERE org_id=? AND status IN ('ongoing','published')) AS active_exams,
          (SELECT COUNT(*) FROM client_assignments WHERE org_id=? AND due_date > NOW()) AS active_assignments,
          (SELECT COUNT(*) FROM client_attendance_sessions WHERE org_id=? AND date=?) AS today_attendance_sessions,
          (SELECT COALESCE(SUM(amount),0) FROM client_fee_payments WHERE org_id=? AND status='completed' AND DATE(payment_date)=?) AS today_collection,
          (SELECT COALESCE(SUM(amount),0) FROM client_fee_payments WHERE org_id=? AND status='completed' AND payment_date >= ? AND payment_date < DATE_ADD(?, INTERVAL 1 MONTH)) AS month_collection,
          -- present_today counts ATTENDANCE RECORDS that say 'present' on the
          -- school's day. An unmarked student has no record and is counted
          -- NOWHERE — not here, and not as an absentee.
          (SELECT COUNT(DISTINCT ar.student_id) FROM client_attendance_records ar JOIN client_attendance_sessions s ON s.id=ar.session_id WHERE ar.org_id=? AND s.date=? AND ar.status='present') AS present_today,
          (SELECT COUNT(*) FROM client_library_books WHERE org_id=?) AS library_books,
          (SELECT COUNT(*) FROM client_book_issues WHERE org_id=? AND status='issued') AS books_issued,
          (SELECT COUNT(*) FROM client_transport_vehicles WHERE org_id=?) AS vehicles
      `, [o,o,o,o,o,o,o,o,o,today,o,today,o,monthStart,monthStart,o,today,o,o,o])
    ]);

    // These four cards are independent — run them in PARALLEL, and give each its
    // own fallback so one failing card can never blank (or 500) the whole
    // dashboard on login. (This is the hottest endpoint in the app.)
    const [recentPayments, recentAdmissions, upcomingExams, attRow] = await Promise.all([
      // Recent activity: last 5 fee payments
      query(
        `SELECT fp.id, fp.amount, fp.payment_date, fp.payment_mode,
          u.first_name, u.last_name, s.admission_number
         FROM client_fee_payments fp
         JOIN client_students s ON s.id=fp.student_id
         JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id
         WHERE fp.org_id=?${activeSchool ? ' AND s.school_id=?' : ''}
         ORDER BY fp.payment_date DESC, fp.id DESC LIMIT 5`, activeSchool ? [o, activeSchool] : [o]
      ).catch(() => []),
      // Recent admissions: newest students with class-section (SUG-0059 §5 —
      // the dashboard card previously reused payments here, wrong data).
      //
      // `u.is_active=1` is the archive check (WW-125). Without it two deleted QA
      // students stayed on the card as recent Active admissions long after they
      // had gone from People › Students — and because `lifecycle_status` still
      // read 'active' on the row, the card asserted it confidently. The first
      // screen the head opens every morning should not be the last to hear that
      // a child was removed.
      query(
        `SELECT s.id, s.admission_number, u.first_name, u.last_name,
                DATE_FORMAT(COALESCE(s.created_at, u.created_at),'%Y-%m-%d') AS applied_on,
                COALESCE(s.lifecycle_status,'active') AS status,
                cl.name AS class_name, sec.name AS section_name
           FROM client_students s
           JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id
           LEFT JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
           LEFT JOIN client_sections sec ON sec.id=e.section_id
           LEFT JOIN client_classes cl ON cl.id=sec.class_id
          WHERE s.org_id=? AND u.is_active=1${activeSchool ? ' AND s.school_id=?' : ''}
          ORDER BY s.id DESC LIMIT 5`, activeSchool ? [o, activeSchool] : [o]
      ).catch(() => []),
      // Upcoming exams
      query(
        `SELECT id, name, exam_type, start_date, status
         FROM client_exams
         WHERE org_id=? AND status IN ('scheduled','ongoing')
         ORDER BY start_date ASC LIMIT 5`, [o]
      ).catch(() => []),
      // TODAY's attendance — present/absent/late/total for THIS DAY only.
      // absent/late are returned so the "today" card can print today's absentee
      // count; it used to borrow the MONTH's absent figure from
      // attendanceBreakdown below and printed the impossible "100% present ·
      // 17 absent" (QA round-5). Today and month are now separate payloads.
      queryOne(
        `SELECT ${STAT_COLS_SQL('ar')}
         FROM client_attendance_records ar
         JOIN client_attendance_sessions s ON s.id=ar.session_id
         WHERE ar.org_id=? AND s.date=?`, [o, today]
      ).catch(() => null),
    ]);
    // total = records MARKED today. Unmarked students are in none of these
    // buckets, so attPct is "% present of those marked" — and it is NULL, never
    // 0% and never 100%, on a day nobody has marked yet (utils/pct.js).
    let attendanceToday = { ...normalizeStats(attRow), date: today };
    let attPct = attendanceToday.pct;

    // ── Chart series (each guarded so a missing column can't break the dashboard) ──
    let monthlyCollection = [];
    try {
      monthlyCollection = await query(
        `SELECT DATE_FORMAT(payment_date,'%Y-%m') AS month, SUM(amount) AS total
           FROM client_fee_payments
          WHERE org_id=? AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
          GROUP BY month ORDER BY month`, [o]);
    } catch(e) { logger.warn('admin monthlyCollection:', e.message); }

    // Student growth = new CURRENT students per month. Same population as
    // total_students above (client_users.is_active = 1 — the canonical
    // definition in modules/erp/students.controller.js → stats()), just sliced
    // by month. Without the join an added-then-archived student stayed in the
    // "New joins" bucket forever, so the dashboard's growth chart and the
    // headline count told different stories.
    let studentGrowth = [];
    try {
      studentGrowth = await query(
        `SELECT DATE_FORMAT(s.created_at,'%Y-%m') AS month, COUNT(*) AS total
           FROM client_students s
           JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id AND u.is_active=1
          WHERE s.org_id=? AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)${activeSchool ? ' AND s.school_id=?' : ''}
          GROUP BY month ORDER BY month`, activeSchool ? [o, activeSchool] : [o]);
    } catch(e) { logger.warn('admin studentGrowth:', e.message); }

    let attendanceBreakdown = { present: 0, absent: 0, late: 0, leave: 0 };
    try {
      const ab = await queryOne(
        `SELECT SUM(ar.status='present') AS present,
                SUM(ar.status='absent') AS absent,
                SUM(ar.status='late') AS late,
                SUM(ar.status IN ('leave','on_leave','excused','half_day')) AS \`leave\`
           FROM client_attendance_records ar
           JOIN client_attendance_sessions s ON s.id=ar.session_id
          WHERE ar.org_id=? AND s.date >= ? AND s.date < DATE_ADD(?, INTERVAL 1 MONTH)`, [o, monthStart, monthStart]);
      if (ab) attendanceBreakdown = { present: +ab.present || 0, absent: +ab.absent || 0, late: +ab.late || 0, leave: +ab.leave || 0 };
    } catch(e) { logger.warn('admin attendanceBreakdown:', e.message); }

    // School-wide performance by exam (SUG-0006) — per exam, class-average % across
    // the school; feeds the Principal / SuperAdmin academic-performance line. Guarded.
    let performanceByExam = [];
    try {
      const rows = await query(
        `SELECT e.id AS exam_id, e.name AS exam_name, e.start_date,
                CONCAT(COALESCE(c.name,''), CASE WHEN sec.name IS NOT NULL THEN CONCAT(' - ', sec.name) ELSE '' END) AS label,
                ROUND(AVG((m.marks_obtained/es.max_marks)*100),1) AS avg_pct
           FROM client_exam_marks m
           JOIN client_exam_subjects es ON es.id=m.exam_subject_id
           JOIN client_exams e ON e.id=m.exam_id
           JOIN client_enrollments en ON en.student_id=m.student_id AND en.status='active'
           JOIN client_sections sec ON sec.id=en.section_id
           JOIN client_classes c ON c.id=sec.class_id
          WHERE m.org_id=? AND m.is_absent=0 AND ${RESULT_ELIGIBLE_SQL}
          GROUP BY e.id, sec.id
          ORDER BY e.start_date DESC, label`, [o]);
      const byExam = {}; const order = [];
      for (const r of rows) {
        if (!byExam[r.exam_id]) { byExam[r.exam_id] = { exam_id: r.exam_id, exam_name: r.exam_name, classes: [] }; order.push(r.exam_id); }
        byExam[r.exam_id].classes.push({ label: r.label || '—', avg: Number(r.avg_pct) || 0 });
      }
      performanceByExam = order.slice(0, 6).map(id => byExam[id]);
    } catch(e) { logger.warn('admin performanceByExam:', e.message); }

    // ── Premium dashboard live sections (kills the May-2025 mock widgets) ──
    // Each block degrades independently; a missing table just yields [].
    let recentLeaves = [];
    try {
      recentLeaves = await query(
        `SELECT lr.id, lr.from_date, lr.to_date, lr.status, lr.applicant_type,
                CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name,
                COALESCE(u.designation, lr.applicant_type) AS role_label
           FROM client_leave_requests lr
           JOIN client_users u ON u.id=lr.applicant_user_id
          WHERE lr.org_id=?
          ORDER BY lr.created_at DESC LIMIT 4`, [o]);
    } catch(e) { logger.warn('admin recentLeaves:', e.message); }

    let pendingCounts = {};
    try {
      const [pc] = await Promise.all([
        queryOne(
          `SELECT
             (SELECT COUNT(*) FROM client_leave_requests WHERE org_id=? AND ${PENDING_LEAVE_SQL}) AS leaves,
             (SELECT COUNT(*) FROM client_link_requests WHERE org_id=? AND status='pending') AS parent_links,
             (SELECT COUNT(*) FROM client_leads l JOIN client_lead_stages st ON st.id=l.stage_id
             WHERE l.org_id=? AND LOWER(st.name) IN ('new','contacted','follow-up','followup')) AS admissions
          `, [o, o, o]),
      ]);
      pendingCounts = pc || {};
    } catch(e) { logger.warn('admin pendingCounts:', e.message); }

    let latestAnnouncements = [];
    try {
      // ADMIN surface — deliberately NOT role-targeted, matching the admin
      // Announcements page (view=manage), which shows every notice in the org.
      // Every NON-admin reader must instead use
      // utils/announcementTargeting.js → announcementVisibleSql().
      latestAnnouncements = await query(
        `SELECT id, title, category, priority, created_at
           FROM announcements
          WHERE org_id=? AND (status IS NULL OR status='active')
          ORDER BY is_pinned DESC, created_at DESC LIMIT 4`, [o]);
    } catch(e) { logger.warn('admin latestAnnouncements:', e.message); }

    // Fee position — the THREE totals a collection rate needs, all all-time:
    // assigned (everything billed), collected (everything paid), outstanding
    // (the difference). The dashboard used to be handed only `feeOutstanding`
    // and paired it with `month_collection`, computing
    //   thisMonthCollected / (thisMonthCollected + allTimeOutstanding)
    // — a this-month numerator over an all-time denominator, which read 25%
    // where the Fees module (total collected / total assigned) read 39%
    // (QA round-5). feeAssigned/feeCollected are now returned so every surface
    // can use the SAME definition the Fees module and /widgets/school-health
    // already use: collected ÷ assigned.
    let feeOutstanding = null, feeAssigned = null, feeCollected = null;
    try {
      const row = await queryOne(
        `SELECT COALESCE(SUM(fa.final_amount),0) AS assigned,
                COALESCE((SELECT SUM(fp.amount) FROM client_fee_payments fp WHERE fp.org_id=? AND fp.status='completed'),0) AS collected
           FROM client_fee_assignments fa WHERE fa.org_id=?`, [o, o]);
      feeAssigned  = Number(row?.assigned) || 0;
      feeCollected = Number(row?.collected) || 0;
      feeOutstanding = Math.max(0, feeAssigned - feeCollected);
    } catch(e) { logger.warn('admin feeOutstanding:', e.message); }

    // Gender breakdown — feeds the Enrolment overview donut (Admin dashboard).
    // Same population as total_students (current students).
    // `unknown` is reported SEPARATELY from `other`: a student whose gender was
    // never captured is not a third gender, and lumping the two together made a
    // school with no gender data on file look like "Boys 0 / Girls 0" — a pie
    // chart of nothing that reads as real data. The client uses `unknown` (and
    // `known`) to show an honest "not captured yet" state instead.
    let genderBreakdown = { male: 0, female: 0, other: 0, unknown: 0, known: 0 };
    try {
      const rows = await query(
        `SELECT s.gender, COUNT(*) AS n
           FROM client_students s JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id
          WHERE s.org_id=? AND u.is_active=1
          GROUP BY s.gender`, [o]);
      for (const r of rows) {
        const g = String(r.gender || '').trim().toLowerCase();
        const n = Number(r.n) || 0;
        if (g === 'male' || g === 'm') genderBreakdown.male += n;
        else if (g === 'female' || g === 'f') genderBreakdown.female += n;
        else if (!g) genderBreakdown.unknown += n;
        else genderBreakdown.other += n;
      }
      genderBreakdown.known = genderBreakdown.male + genderBreakdown.female + genderBreakdown.other;
    } catch(e) { logger.warn('admin genderBreakdown:', e.message); }

    // Staff on leave today — feeds the Staff summary card (Admin dashboard).
    let staffOnLeaveToday = 0;
    try {
      const row = await queryOne(
        `SELECT COUNT(*) AS n FROM client_leave_requests
          WHERE org_id=? AND applicant_type='staff' AND status IN ('approved','pending_admin')
            AND CURDATE() BETWEEN from_date AND to_date`, [o]);
      staffOnLeaveToday = Number(row?.n) || 0;
    } catch(e) { logger.warn('admin staffOnLeaveToday:', e.message); }

    // New staff this month — same pattern as studentGrowth, staff side.
    let newStaffThisMonth = 0;
    try {
      const row = await queryOne(
        `SELECT COUNT(DISTINCT u.id) AS n
           FROM client_users u JOIN client_user_roles ur ON ur.user_id=u.id JOIN client_roles r ON r.id=ur.role_id
          WHERE u.org_id=? AND r.base_role='teacher'
            AND MONTH(u.created_at)=MONTH(CURDATE()) AND YEAR(u.created_at)=YEAR(CURDATE())`, [o]);
      newStaffThisMonth = Number(row?.n) || 0;
    } catch(e) { logger.warn('admin newStaffThisMonth:', e.message); }

    // ── Multi-branch: when a branch is active, override the headline KPI numbers
    // with branch-scoped counts (small guarded queries; single-branch orgs skip
    // this entirely and keep the org-wide figures untouched). Kept as targeted
    // overrides — never touch the big query's param list — so it cannot misalign.
    if (activeSchool) {
      try {
        const s = activeSchool;
        const [stu, tch, staffAll, cls, sec, sess, todColl, monColl, presToday, attB, assignedB, collectedB] = await Promise.all([
          queryOne(`SELECT COUNT(*) n FROM client_students st JOIN client_users u ON u.id=st.user_id WHERE st.org_id=? AND u.is_active=1 AND st.school_id=?`, [o, s]),
          queryOne(`SELECT COUNT(DISTINCT us.user_id) n FROM client_user_schools us
                    JOIN client_user_roles ur ON ur.user_id=us.user_id AND ur.org_id=us.org_id
                    JOIN client_roles r ON r.id=ur.role_id AND r.base_role='teacher'
                    WHERE us.org_id=? AND us.school_id=?`, [o, s]),
          queryOne(`SELECT COUNT(DISTINCT us.user_id) n FROM client_user_schools us
                    JOIN client_user_roles ur ON ur.user_id=us.user_id AND ur.org_id=us.org_id
                    JOIN client_roles r ON r.id=ur.role_id AND r.base_role NOT IN ('student','parent')
                    WHERE us.org_id=? AND us.school_id=?`, [o, s]),
          queryOne(`SELECT COUNT(*) n FROM client_classes WHERE org_id=? AND school_id=?`, [o, s]),
          queryOne(`SELECT COUNT(*) n FROM client_sections WHERE org_id=? AND school_id=?`, [o, s]),
          queryOne(`SELECT COUNT(*) n FROM client_attendance_sessions ses JOIN client_sections sc ON sc.id=ses.section_id WHERE ses.org_id=? AND ses.date=? AND sc.school_id=?`, [o, today, s]),
          queryOne(`SELECT COALESCE(SUM(fp.amount),0) v FROM client_fee_payments fp JOIN client_students st ON st.id=fp.student_id WHERE fp.org_id=? AND fp.status='completed' AND DATE(fp.payment_date)=? AND st.school_id=?`, [o, today, s]),
          queryOne(`SELECT COALESCE(SUM(fp.amount),0) v FROM client_fee_payments fp JOIN client_students st ON st.id=fp.student_id WHERE fp.org_id=? AND fp.status='completed' AND fp.payment_date >= ? AND fp.payment_date < DATE_ADD(?, INTERVAL 1 MONTH) AND st.school_id=?`, [o, monthStart, monthStart, s]),
          queryOne(`SELECT COUNT(DISTINCT ar.student_id) n FROM client_attendance_records ar JOIN client_attendance_sessions ses ON ses.id=ar.session_id JOIN client_sections sc ON sc.id=ses.section_id WHERE ar.org_id=? AND ses.date=? AND ar.status='present' AND sc.school_id=?`, [o, today, s]),
          queryOne(`SELECT ${STAT_COLS_SQL('ar')} FROM client_attendance_records ar JOIN client_attendance_sessions ses ON ses.id=ar.session_id JOIN client_sections sc ON sc.id=ses.section_id WHERE ar.org_id=? AND ses.date=? AND sc.school_id=?`, [o, today, s]),
          queryOne(`SELECT COALESCE(SUM(fa.final_amount),0) v FROM client_fee_assignments fa JOIN client_students st ON st.id=fa.student_id WHERE fa.org_id=? AND st.school_id=?`, [o, s]),
          queryOne(`SELECT COALESCE(SUM(fp.amount),0) v FROM client_fee_payments fp JOIN client_students st ON st.id=fp.student_id WHERE fp.org_id=? AND fp.status='completed' AND st.school_id=?`, [o, s]),
        ]);
        if (counts) {
          counts.total_students = stu?.n || 0;
          counts.total_teachers = tch?.n || 0;
          counts.total_staff = staffAll?.n || 0;
          counts.total_classes = cls?.n || 0;
          counts.total_sections = sec?.n || 0;
          counts.today_attendance_sessions = sess?.n || 0;
          counts.today_collection = Number(todColl?.v || 0);
          counts.month_collection = Number(monColl?.v || 0);
          counts.present_today = presToday?.n || 0;
        }
        attendanceToday = { ...normalizeStats(attB), date: today };
        attPct = attendanceToday.pct;
        feeAssigned  = Number(assignedB?.v || 0);
        feeCollected = Number(collectedB?.v || 0);
        feeOutstanding = Math.max(0, feeAssigned - feeCollected);
      } catch (e) { logger.warn('admin branch-scope override:', e.message); }
    }

    return success(res, { counts, recentPayments, recentAdmissions, upcomingExams, attPct, monthlyCollection, studentGrowth,
      // attendanceToday = TODAY only · attendanceBreakdown = THIS MONTH. Two
      // different windows, two different payload keys, never interchangeable.
      attendanceToday, attendanceBreakdown, performanceByExam,
      recentLeaves, pendingCounts, latestAnnouncements, feeOutstanding, feeAssigned, feeCollected,
      genderBreakdown, staffOnLeaveToday, newStaffThisMonth });
  } catch(e) { logger.error('Admin home:',e); return error(res, e.message, 500); }
});

// ─── TEACHER: today's view + pending work ──────────────────────────────────
router.get('/teacher', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const todayKey = todayKeyIST();

    // Today's classes (LEFT JOINs: a slot with a missing section/class row
    // must still count — the timetable page shows it, so the dashboard must)
    const todayClasses = await query(
      `SELECT ts.*, sub.name AS subject_name, sub.color AS subject_color,
        sec.name AS section_name, c.name AS class_name
       FROM client_timetable_slots ts
       LEFT JOIN client_subjects sub ON sub.id=ts.subject_id
       LEFT JOIN client_sections sec ON sec.id=ts.section_id
       LEFT JOIN client_classes c ON c.id=ts.class_id
       WHERE ts.teacher_id=? AND ts.org_id=? AND ts.day_of_week=? AND ts.slot_type='class'
       ORDER BY ts.period_number`, [uid, o, todayKey]
    );

    // Pending grading: submissions without marks
    const pendingGrading = await query(
      `SELECT COUNT(*) AS cnt FROM client_assignment_submissions sub
       JOIN client_assignments a ON a.id=sub.assignment_id
       WHERE a.teacher_id=? AND sub.org_id=? AND sub.status='submitted'`, [uid, o]
    );

    // Recent submissions
    const recentSubmissions = await query(
      `SELECT sub.*, a.title, a.max_marks,
        u.first_name, u.last_name
       FROM client_assignment_submissions sub
       JOIN client_assignments a ON a.id=sub.assignment_id
       JOIN client_students s ON s.id=sub.student_id
       JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id
       WHERE a.teacher_id=? AND sub.org_id=?
       ORDER BY sub.submitted_at DESC LIMIT 5`, [uid, o]
    );

    // My assignments stats
    const myAssignments = await queryOne(
      `SELECT 
        COUNT(*) AS total,
        SUM(due_date > NOW()) AS upcoming,
        SUM(due_date < NOW()) AS past_due
       FROM client_assignments WHERE teacher_id=? AND org_id=?`, [uid, o]
    );

    // My exams
    const myExams = await query(
      `SELECT id, name, status, start_date
       FROM client_exams
       WHERE org_id=? AND status IN ('ongoing','scheduled')
       ORDER BY start_date ASC LIMIT 3`, [o]
    );

    // Unread messages count (best effort)
    let unreadMessages = 0;
    try {
      const u = await queryOne(
        `SELECT COUNT(*) AS cnt FROM client_messages m
         WHERE m.org_id=? AND m.sender_id != ? AND m.is_read=0
           AND m.thread_id IN (
             SELECT DISTINCT thread_id FROM client_messages WHERE sender_id=? AND org_id=?
           )`, [o, uid, uid, o]
      );
      unreadMessages = u?.cnt || 0;
    } catch {}

    // Teacher weekly load — count only slots the timetable grid renders
    // (configured working days + period range), matching /timetable/teacher.
    const ttCfg = await queryOne('SELECT working_days, periods_per_day FROM client_timetable_config WHERE org_id=?', [o]);
    const workingDays = (ttCfg?.working_days || 'Mon,Tue,Wed,Thu,Fri,Sat').split(',');
    const weeklyLoad = await queryOne(
      `SELECT COUNT(*) AS periods,
        COUNT(DISTINCT class_id) AS classes,
        COUNT(DISTINCT subject_id) AS subjects
       FROM client_timetable_slots
       WHERE teacher_id=? AND org_id=? AND slot_type='class'
         AND day_of_week IN (${workingDays.map(()=>'?').join(',')})
         AND period_number BETWEEN 1 AND ?`,
      [uid, o, ...workingDays, ttCfg?.periods_per_day || 8]
    );

    // Pending Tasks — the teacher's OWN assignments with submitted-but-ungraded
    // work: Task · Class · Subject · Due + pending count; deep-links to grading.
    // (SUG-0016) Guarded so a schema mismatch can't break the dashboard.
    let pendingTasks = [];
    try {
      pendingTasks = await query(
        `SELECT a.id, a.title, a.due_date,
                sub.name AS subject_name,
                CONCAT(COALESCE(c.name,''), CASE WHEN sec.name IS NOT NULL THEN CONCAT(' - ', sec.name) ELSE '' END) AS class_label,
                COUNT(s.id) AS pending
           FROM client_assignments a
           JOIN client_assignment_submissions s ON s.assignment_id=a.id AND s.status='submitted'
           LEFT JOIN client_subjects sub ON sub.id=a.subject_id
           LEFT JOIN client_sections sec ON sec.id=a.section_id
           LEFT JOIN client_classes c ON c.id=sec.class_id
          WHERE a.teacher_id=? AND a.org_id=?
          GROUP BY a.id
          ORDER BY a.due_date ASC LIMIT 6`, [uid, o]);
    } catch(e) { logger.warn('teacher pendingTasks:', e.message); }

    // Assignment status per class (SUG-0014) — the teacher's OWN assignments per
    // section: total / active (due ahead) / overdue. Class-wise switchable. Guarded.
    let assignmentStatusByClass = [];
    try {
      assignmentStatusByClass = await query(
        `SELECT a.section_id,
                CONCAT(COALESCE(c.name,''), CASE WHEN sec.name IS NOT NULL THEN CONCAT(' - ', sec.name) ELSE '' END) AS label,
                COUNT(*) AS total,
                SUM(a.due_date >= NOW()) AS active,
                SUM(a.due_date < NOW()) AS overdue
           FROM client_assignments a
           LEFT JOIN client_sections sec ON sec.id=a.section_id
           LEFT JOIN client_classes c ON c.id=sec.class_id
          WHERE a.teacher_id=? AND a.org_id=?
          GROUP BY a.section_id
          ORDER BY label`, [uid, o]);
    } catch(e) { logger.warn('teacher assignmentStatusByClass:', e.message); }

    // Performance by exam (SUG-0010) — real "term/exam" switcher. Per exam, the
    // class-average % for the sections THIS teacher teaches (teacher-scoped:
    // timetable ∪ subject assignments ∪ class-teacher duty).
    // Grouped into [{ exam_id, exam_name, classes:[{label, avg}] }]. Guarded.
    const tScope = teacherSectionsSql(o, uid);
    let performanceByExam = [];
    try {
      const rows = await query(
        `SELECT e.id AS exam_id, e.name AS exam_name, e.start_date,
                CONCAT(COALESCE(c.name,''), CASE WHEN sec.name IS NOT NULL THEN CONCAT(' - ', sec.name) ELSE '' END) AS label,
                ROUND(AVG((m.marks_obtained/es.max_marks)*100),1) AS avg_pct
           FROM client_exam_marks m
           JOIN client_exam_subjects es ON es.id=m.exam_subject_id
           JOIN client_exams e ON e.id=m.exam_id
           JOIN client_enrollments en ON en.student_id=m.student_id AND en.status='active'
           JOIN client_sections sec ON sec.id=en.section_id
           JOIN client_classes c ON c.id=sec.class_id
          WHERE m.org_id=? AND m.is_absent=0 AND ${RESULT_ELIGIBLE_SQL}
            AND sec.id IN (${tScope.sql})
          GROUP BY e.id, sec.id
          ORDER BY e.start_date DESC, label`, [o, ...tScope.params]);
      const byExam = {}; const order = [];
      for (const r of rows) {
        if (!byExam[r.exam_id]) { byExam[r.exam_id] = { exam_id: r.exam_id, exam_name: r.exam_name, classes: [] }; order.push(r.exam_id); }
        byExam[r.exam_id].classes.push({ label: r.label || '—', avg: Number(r.avg_pct) || 0 });
      }
      performanceByExam = order.slice(0, 6).map(id => byExam[id]);
    } catch(e) { logger.warn('teacher performanceByExam:', e.message); }

    // Tomorrow's classes (SUG-0015) — the merged "Today's & Upcoming" widget shows
    // today's remaining periods → tomorrow's classes. Guarded.
    let tomorrowClasses = [];
    try {
      const tomorrowKey = dayMap[(new Date(Date.now() + 5.5 * 3600 * 1000).getUTCDay() + 1) % 7];
      tomorrowClasses = await query(
        `SELECT ts.*, sub.name AS subject_name, sub.color AS subject_color,
                sec.name AS section_name, c.name AS class_name
           FROM client_timetable_slots ts
           LEFT JOIN client_subjects sub ON sub.id=ts.subject_id
           LEFT JOIN client_sections sec ON sec.id=ts.section_id
           LEFT JOIN client_classes c ON c.id=ts.class_id
          WHERE ts.teacher_id=? AND ts.org_id=? AND ts.day_of_week=? AND ts.slot_type='class'
          ORDER BY ts.period_number`, [uid, o, tomorrowKey]);
    } catch(e) { logger.warn('teacher tomorrowClasses:', e.message); }

    // REAL student count + class breakdown (distinct students across the
    // teacher's taught sections) — replaces the old hardcoded "128".
    // Scoped by the full teacher scope (timetable ∪ subject assignments ∪ class
    // teacher), not the timetable alone — a school that has assigned its
    // teachers but not yet drawn a timetable used to see "0 classes, 0
    // students" on every teacher dashboard. — JDPS P-0, 2026-07-29
    let classBreakdown = [], myStudents = 0;
    try {
      
      classBreakdown = await query(
        `SELECT CONCAT(COALESCE(c.name,''), CASE WHEN sec.name IS NOT NULL THEN CONCAT(' - ', sec.name) ELSE '' END) AS label,
                COUNT(DISTINCT e.student_id) AS count
           FROM client_sections sec
           JOIN client_classes c ON c.id=sec.class_id
           LEFT JOIN client_enrollments e ON e.section_id=sec.id AND e.org_id=sec.org_id AND e.status='active'
          WHERE sec.org_id=? AND sec.id IN (${tScope.sql})
          GROUP BY sec.id ORDER BY COALESCE(c.display_order, c.standard*10), c.standard, sec.name`, [o, ...tScope.params]);
      const seen = await queryOne(
        `SELECT COUNT(DISTINCT e.student_id) AS n
           FROM client_enrollments e
          WHERE e.org_id=? AND e.status='active' AND e.section_id IN (${tScope.sql})`, [o, ...tScope.params]);
      myStudents = seen?.n || 0;
    } catch(e) { logger.warn('teacher classBreakdown:', e.message); }

    // REAL attendance % across the teacher's sections, this month
    let myAttendancePct = null;
    try {
      const mStart = istToday().slice(0, 7) + '-01';
      const a = await queryOne(
        `SELECT ${STAT_COLS_SQL('ar')}
           FROM client_attendance_records ar
           JOIN client_attendance_sessions s ON s.id=ar.session_id
          WHERE ar.org_id=? AND s.section_id IN (${tScope.sql})
            AND s.date >= ? AND s.date < DATE_ADD(?, INTERVAL 1 MONTH)`,
        [o, ...tScope.params, mStart, mStart]);
      myAttendancePct = normalizeStats(a).pct;
    } catch(e) { logger.warn('teacher attendancePct:', e.message); }

    // REAL content counts (items this teacher uploaded/assigned), by kind
    let myContent = { total: 0 };
    try {
      const rows = await query(
        `SELECT type, COUNT(*) AS n FROM client_content_items WHERE org_id=? AND uploaded_by=? GROUP BY type`, [o, uid]);
      myContent = rows.reduce((m, r) => { m[r.type] = r.n; m.total += r.n; return m; }, { total: 0 });
    } catch(e) { logger.warn('teacher myContent:', e.message); }

    return success(res, {
      todayClasses, tomorrowClasses, recentSubmissions, myAssignments, myExams,
      pendingGrading: pendingGrading[0]?.cnt || 0,
      pendingTasks, assignmentStatusByClass, performanceByExam,
      unreadMessages, weeklyLoad,
      myStudents, classBreakdown, myAttendancePct, myContent,
      today: todayKey
    });
  } catch(e) { logger.error('Teacher home:',e); return error(res, e.message, 500); }
});

// ─── STUDENT: today's schedule + pending + grades ──────────────────────────
router.get('/student', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const todayKey = todayKeyIST();

    const student = await queryOne(
      `SELECT s.id, s.admission_number, u.first_name, u.last_name
       FROM client_students s JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id
       WHERE u.id=? AND s.org_id=?`, [uid, o]
    );
    if (!student) return error(res, 'Student not found', 404);

    const enrollment = await queryOne(
      `SELECT e.section_id, sec.name AS section_name, c.name AS class_name
       FROM client_enrollments e
       JOIN client_sections sec ON sec.id=e.section_id
       JOIN client_classes c ON c.id=sec.class_id
       WHERE e.student_id=? AND e.status='active' AND e.org_id=?`, [student.id, o]
    );

    // Today's classes
    let todayClasses = [];
    if (enrollment) {
      todayClasses = await query(
        `SELECT ts.*, sub.name AS subject_name, sub.color AS subject_color,
          CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS teacher_name
         FROM client_timetable_slots ts
         LEFT JOIN client_subjects sub ON sub.id=ts.subject_id
         LEFT JOIN client_users u ON u.id=ts.teacher_id
         WHERE ts.section_id=? AND ts.org_id=? AND ts.day_of_week=? AND ts.slot_type='class'
         ORDER BY ts.period_number`, [enrollment.section_id, o, todayKey]
      );
    }

    // Pending homework
    const pendingHomework = enrollment ? await query(
      `SELECT a.id, a.title, a.due_date, a.max_marks,
        s.name AS subject_name, s.color AS subject_color
       FROM client_assignments a
       LEFT JOIN client_subjects s ON s.id=a.subject_id
       LEFT JOIN client_assignment_submissions sub ON sub.assignment_id=a.id AND sub.student_id=?
       WHERE a.section_id=? AND a.org_id=? AND a.status='published'
         AND sub.id IS NULL
       ORDER BY a.due_date ASC LIMIT 5`, [student.id, enrollment.section_id, o]
    ) : [];

    // Attendance — TWO explicit scopes computed by the ONE shared definition
    // (utils/attendanceStats.js): same unit (attendance records), same JOIN,
    // same 1-dp rounding as /student-portal/attendance and
    // /attendance/student/:id. `pct` is ALL-TIME and the card says "overall";
    // `month` is the current school month, for any surface that says "this
    // month". A surface may never label one as the other.
    const monthStart = istToday().slice(0, 7) + '-01';
    const [attRow, attMonthRow] = await Promise.all([
      queryOne(
        `SELECT ${STAT_COLS_SQL('ar')}
           FROM client_attendance_records ar
           JOIN client_attendance_sessions s ON s.id=ar.session_id
          WHERE ar.student_id=? AND ar.org_id=?`, [student.id, o]),
      queryOne(
        `SELECT ${STAT_COLS_SQL('ar')}
           FROM client_attendance_records ar
           JOIN client_attendance_sessions s ON s.id=ar.session_id
          WHERE ar.student_id=? AND ar.org_id=?
            AND s.date >= ? AND s.date < DATE_ADD(?, INTERVAL 1 MONTH)`,
        [student.id, o, monthStart, monthStart]),
    ]);
    const attendance = normalizeStats(attRow);
    const attendanceMonth = normalizeStats(attMonthRow);
    const attPct = attendance.pct;

    // Fee data is a parent/admin concern — product policy: students never
    // see fee information, so none is computed or returned here.

    // Latest exam result — utils/examResult.js is the single source: same
    // eligibility (roster-linked, result-bearing exam) and same 1-dp rounding
    // the parent dashboard and the Performance page use. HAVING drops a group
    // whose weightage sums to 0 so we never print a fabricated percentage.
    const latestResult = await queryOne(
      `SELECT e.id, e.name, e.start_date, ${WEIGHTED_PCT_COL} AS weighted_pct
       FROM client_exam_marks m
       JOIN client_exam_subjects es ON es.id=m.exam_subject_id
       JOIN client_exams e ON e.id=m.exam_id
       WHERE m.student_id=? AND m.org_id=? AND ${MARK_COUNTED_SQL} AND ${RESULT_ELIGIBLE_SQL}
       GROUP BY e.id, e.name, e.start_date
       HAVING weighted_pct IS NOT NULL
       ORDER BY e.start_date DESC LIMIT 1`, [student.id, o]
    );

    // Published report cards count
    const reportCards = await queryOne(
      `SELECT COUNT(DISTINCT p.exam_id) AS cnt
       FROM client_reportcard_publishes p
       JOIN client_exam_marks m ON m.exam_id=p.exam_id AND m.student_id=?
       WHERE p.org_id=? AND p.published=1`, [student.id, o]
    );

    // Performance trend (SUG-0006) — the student's weighted % per exam. Guarded.
    let performanceByExam = [];
    try {
      performanceByExam = await query(
        `SELECT e.id AS exam_id, e.name AS exam_name, ${WEIGHTED_PCT_COL} AS pct
           FROM client_exam_marks m
           JOIN client_exam_subjects es ON es.id=m.exam_subject_id
           JOIN client_exams e ON e.id=m.exam_id
          WHERE m.student_id=? AND m.org_id=? AND ${MARK_COUNTED_SQL} AND ${RESULT_ELIGIBLE_SQL}
          GROUP BY e.id, e.name, e.start_date
          HAVING pct IS NOT NULL
          ORDER BY e.start_date ASC LIMIT 8`, [student.id, o]);
    } catch(e) { logger.warn('student performanceByExam:', e.message); }

    // Subject-wise average % (for subject-progress bars). Guarded.
    let subjectPerformance = [];
    try {
      // Same eligibility gate as latestResult: subject bars must be built from
      // exactly the exams that are allowed to show a result, or the bars and
      // the headline number describe different sets of exams.
      subjectPerformance = await query(
        `SELECT s.name AS subject_name, s.color AS subject_color,
                ROUND(AVG(CASE WHEN m.is_absent=1 THEN 0
                               ELSE m.marks_obtained/NULLIF(es.max_marks,0)*100 END),1) AS pct
           FROM client_exam_marks m
           JOIN client_exam_subjects es ON es.id=m.exam_subject_id
           JOIN client_exams e ON e.id=m.exam_id
           JOIN client_subjects s ON s.id=es.subject_id
          WHERE m.student_id=? AND m.org_id=? AND ${MARK_COUNTED_SQL} AND ${RESULT_ELIGIBLE_SQL}
          GROUP BY es.subject_id, s.name, s.color
          HAVING pct IS NOT NULL
          ORDER BY s.name`, [student.id, o]);
    } catch(e) { logger.warn('student subjectPerformance:', e.message); }

    // Today's Snapshot extras (SUG-0060 §1): upcoming tests + today's own status
    let upcomingTests = [];
    try {
      if (enrollment) {
        upcomingTests = await query(
          `SELECT q.id, q.title, DATE_FORMAT(q.available_until,'%Y-%m-%d') AS until_date, 'quiz' AS kind
             FROM client_quizzes q
            WHERE q.org_id=? AND q.section_id=? AND q.status='published' AND q.available_until >= NOW()
            ORDER BY q.available_until ASC LIMIT 3`, [o, enrollment.section_id]);
        // Scoped to the exams THIS child actually sits.
        //
        // This was org-wide: any exam anywhere in the school counted as the
        // student's own upcoming test. So a Class 9 student's dashboard could
        // announce "1 Upcoming test" for a Class 10 paper, and the Tests page —
        // which correctly lists only their own — showed nothing (WW-102). The
        // child is told there is a test and given no way to find out which.
        //
        // An exam with no section linked yet belongs to nobody, so it stays out
        // rather than being shown to everybody.
        const nextExam = await queryOne(
          `SELECT e.id, e.name AS title, DATE_FORMAT(e.start_date,'%Y-%m-%d') AS until_date
             FROM client_exams e
             JOIN client_exam_sections xs ON xs.exam_id=e.id AND xs.org_id=e.org_id
            WHERE e.org_id=? AND xs.section_id=?
              AND e.start_date >= CURDATE() AND (e.status IS NULL OR e.status NOT IN ('draft','cancelled'))
            ORDER BY e.start_date ASC LIMIT 1`, [o, enrollment.section_id]);
        if (nextExam) upcomingTests.push({ ...nextExam, kind: 'exam' });
      }
    } catch (e) { logger.warn('student upcomingTests:', e.message); }

    let attendanceToday = null;
    try {
      const todayDate = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
      const rec = await queryOne(
        `SELECT ar.status FROM client_attendance_records ar
           JOIN client_attendance_sessions ses ON ses.id=ar.session_id
          WHERE ar.student_id=? AND ses.org_id=? AND ses.date=? LIMIT 1`, [student.id, o, todayDate]);
      attendanceToday = rec?.status || null;
    } catch (e) { logger.warn('student attendanceToday:', e.message); }

    return success(res, {
      student, enrollment, todayClasses, pendingHomework,
      attendance: { ...attendance, pct: attPct, month: attendanceMonth, today: attendanceToday },
      upcomingTests,
      latestResult, performanceByExam, subjectPerformance,
      reportCardsCount: reportCards?.cnt || 0,
      today: todayKey,
    });
  } catch(e) { logger.error('Student home:',e); return error(res, e.message, 500); }
});

// ─── PARENT: per-child summary ─────────────────────────────────────────────
router.get('/parent', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const todayKey = todayKeyIST();

    const parent = await queryOne(
      'SELECT id FROM client_parents WHERE user_id=? AND org_id=?', [uid, o]
    );
    if (!parent) return error(res, 'Parent not found', 404);

    const children = await query(
      `SELECT cs.id AS student_id, cs.admission_number,
        u.first_name, u.last_name,
        e.section_id, sec.name AS section_name, c.name AS class_name
       FROM client_parent_students ps
       JOIN client_students cs ON cs.id=ps.student_id
       JOIN client_users u ON u.id=cs.user_id
       LEFT JOIN client_enrollments e ON e.student_id=cs.id AND e.status='active'
       LEFT JOIN client_sections sec ON sec.id=e.section_id
       LEFT JOIN client_classes c ON c.id=sec.class_id
       WHERE ps.parent_id=? AND ps.org_id=? AND COALESCE(ps.status,'active')='active'`, [parent.id, o]
    );

    // Fan the per-child work out in PARALLEL (was sequential → a 3-child parent did
    // ~18 serial round-trips and felt slow). Each child's block still runs its own
    // queries, but all children run at once.
    await Promise.all(children.map(async (child) => {
      // Today's classes
      if (child.section_id) {
        child.todayClasses = await query(
          `SELECT ts.period_number, sub.name AS subject_name, sub.color AS subject_color,
            CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS teacher_name
           FROM client_timetable_slots ts
           LEFT JOIN client_subjects sub ON sub.id=ts.subject_id
           LEFT JOIN client_users u ON u.id=ts.teacher_id
           WHERE ts.section_id=? AND ts.org_id=? AND ts.day_of_week=? AND ts.slot_type='class'
           ORDER BY ts.period_number`, [child.section_id, o, todayKey]
        );

        // Pending homework
        child.pendingHomework = await query(
          `SELECT a.id, a.title, a.due_date
           FROM client_assignments a
           LEFT JOIN client_assignment_submissions sub ON sub.assignment_id=a.id AND sub.student_id=?
           WHERE a.section_id=? AND a.org_id=? AND a.status='published' AND sub.id IS NULL
           ORDER BY a.due_date ASC LIMIT 3`, [child.student_id, child.section_id, o]
        );

        // Published report cards count
        const rc = await queryOne(
          `SELECT COUNT(DISTINCT p.exam_id) AS cnt
           FROM client_reportcard_publishes p
           JOIN client_exam_marks m ON m.exam_id=p.exam_id AND m.student_id=?
           WHERE p.org_id=? AND p.published=1`, [child.student_id, o]
        );
        child.reportCardsCount = rc?.cnt || 0;
      } else {
        child.todayClasses = [];
        child.pendingHomework = [];
        child.reportCardsCount = 0;
      }

      // Attendance — the SAME shared definition and scopes the student's own
      // dashboard uses, so parent and child can never see different numbers for
      // the same scope. `attendancePct` is ALL-TIME ("overall");
      // `attendanceMonthPct` is the current school month.
      const pMonthStart = istToday().slice(0, 7) + '-01';
      const [att, attMonth] = await Promise.all([
        queryOne(
          `SELECT ${STAT_COLS_SQL('ar')}
             FROM client_attendance_records ar
             JOIN client_attendance_sessions s ON s.id=ar.session_id
            WHERE ar.student_id=? AND ar.org_id=?`, [child.student_id, o]),
        queryOne(
          `SELECT ${STAT_COLS_SQL('ar')}
             FROM client_attendance_records ar
             JOIN client_attendance_sessions s ON s.id=ar.session_id
            WHERE ar.student_id=? AND ar.org_id=?
              AND s.date >= ? AND s.date < DATE_ADD(?, INTERVAL 1 MONTH)`,
          [child.student_id, o, pMonthStart, pMonthStart]),
      ]);
      child.attendance = normalizeStats(att);
      child.attendanceMonth = normalizeStats(attMonth);
      child.attendancePct = child.attendance.pct;
      child.attendanceMonthPct = child.attendanceMonth.pct;

      // Fee due
      const fees = await queryOne(
        `SELECT
           (SELECT COALESCE(SUM(final_amount),0) FROM client_fee_assignments WHERE student_id=? AND org_id=?) AS total,
           (SELECT COALESCE(SUM(amount),0) FROM client_fee_payments WHERE student_id=? AND org_id=? AND status='completed') AS paid`,
        [child.student_id, o, child.student_id, o]
      );
      child.feeDue = Math.max(0, parseFloat(fees.total||0) - parseFloat(fees.paid||0));

      // Per-child performance trend (SUG-0006) — weighted % per exam. Guarded.
      // Identical query to the student's own dashboard (utils/examResult.js), so
      // "Latest result" cannot differ between the child's view and the parent's.
      try {
        child.performanceByExam = await query(
          `SELECT e.id AS exam_id, e.name AS exam_name, ${WEIGHTED_PCT_COL} AS pct
             FROM client_exam_marks m
             JOIN client_exam_subjects es ON es.id=m.exam_subject_id
             JOIN client_exams e ON e.id=m.exam_id
            WHERE m.student_id=? AND m.org_id=? AND ${MARK_COUNTED_SQL} AND ${RESULT_ELIGIBLE_SQL}
            GROUP BY e.id, e.name, e.start_date
            HAVING pct IS NOT NULL
            ORDER BY e.start_date ASC LIMIT 8`, [child.student_id, o]);
      } catch(e) { child.performanceByExam = []; }

      // "Latest result" — served, not re-derived on the client. The parent card
      // used to take the last element of performanceByExam (capped at 8, and a
      // different rounding), which is a second definition of the same figure.
      try {
        child.latestResult = await queryOne(
          `SELECT e.id, e.name, e.start_date, ${WEIGHTED_PCT_COL} AS weighted_pct
             FROM client_exam_marks m
             JOIN client_exam_subjects es ON es.id=m.exam_subject_id
             JOIN client_exams e ON e.id=m.exam_id
            WHERE m.student_id=? AND m.org_id=? AND ${MARK_COUNTED_SQL} AND ${RESULT_ELIGIBLE_SQL}
            GROUP BY e.id, e.name, e.start_date
            HAVING weighted_pct IS NOT NULL
            ORDER BY e.start_date DESC LIMIT 1`, [child.student_id, o]);
      } catch(e) { child.latestResult = null; }
    }));

    return success(res, { children, today: todayKey });
  } catch(e) { logger.error('Parent home:',e); return error(res, 'Could not load dashboard', 500); }
});

// ─── OWNER: org-wide intel ─────────────────────────────────────────────────
router.get('/owner', requireRole('owner','super_admin','system_admin'), async (req, res) => {
  try {
    const o = req.user.org_id;

    const counts = await queryOne(`
      SELECT
        (SELECT COUNT(*) FROM client_students s JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id WHERE s.org_id=? AND u.is_active=1) AS students,
        (SELECT COUNT(*) FROM client_users u WHERE u.org_id=? AND u.is_active=1 AND EXISTS (
           SELECT 1 FROM client_user_roles ur JOIN client_roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.base_role='teacher'
        )) AS teachers,
        (SELECT COUNT(*) FROM client_parents WHERE org_id=?) AS parents,
        (SELECT COUNT(*) FROM client_classes WHERE org_id=?) AS classes,
        (SELECT COUNT(*) FROM client_sections WHERE org_id=?) AS sections,
        (SELECT COUNT(*) FROM client_exams WHERE org_id=?) AS total_exams,
        (SELECT COUNT(*) FROM client_assignments WHERE org_id=?) AS total_assignments,
        (SELECT COALESCE(SUM(amount),0) FROM client_fee_payments WHERE org_id=? AND status='completed') AS total_collected,
        (SELECT COALESCE(SUM(final_amount),0) FROM client_fee_assignments WHERE org_id=?) AS total_assigned
    `, [o,o,o,o,o,o,o,o,o]);

    // Monthly collection trend (last 6 months)
    const monthlyCollection = await query(`
      SELECT 
        DATE_FORMAT(payment_date, '%Y-%m') AS month,
        SUM(amount) AS total
       FROM client_fee_payments 
       WHERE org_id=? AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month`, [o]
    );

    // Top performing classes (by average)
    const classPerformance = await query(`
      SELECT c.name AS class_name, sec.name AS section_name,
        ROUND(AVG((m.marks_obtained/es.max_marks)*100),1) AS avg_pct,
        COUNT(DISTINCT m.student_id) AS student_count
       FROM client_exam_marks m
       JOIN client_exam_subjects es ON es.id=m.exam_subject_id
       JOIN client_enrollments e ON e.student_id=m.student_id AND e.status='active'
       JOIN client_sections sec ON sec.id=e.section_id
       JOIN client_classes c ON c.id=sec.class_id
       WHERE m.org_id=? AND m.is_absent=0
       GROUP BY sec.id ORDER BY avg_pct DESC LIMIT 5`, [o]
    );

    // Student growth (new students per month, last 6 months) — guarded
    let studentGrowth = [];
    try {
      studentGrowth = await query(
        `SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS total
           FROM client_students
          WHERE org_id=? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
          GROUP BY month ORDER BY month`, [o]);
    } catch(e) { logger.warn('owner studentGrowth:', e.message); }

    // Org-wide attendance breakdown (this month) — guarded
    let attendanceBreakdown = { present: 0, absent: 0, late: 0, leave: 0 };
    try {
      const ab = await queryOne(
        `SELECT SUM(ar.status='present') AS present,
                SUM(ar.status='absent') AS absent,
                SUM(ar.status='late') AS late,
                SUM(ar.status IN ('leave','on_leave','excused','half_day')) AS \`leave\`
           FROM client_attendance_records ar
           JOIN client_attendance_sessions s ON s.id=ar.session_id
          WHERE ar.org_id=? AND s.date >= ? AND s.date < DATE_ADD(?, INTERVAL 1 MONTH)`, [o, istToday().slice(0,7)+'-01', istToday().slice(0,7)+'-01']);
      if (ab) attendanceBreakdown = { present: +ab.present || 0, absent: +ab.absent || 0, late: +ab.late || 0, leave: +ab.leave || 0 };
    } catch(e) { logger.warn('owner attendanceBreakdown:', e.message); }

    return success(res, { counts, monthlyCollection, classPerformance, studentGrowth, attendanceBreakdown });
  } catch(e) { logger.error('Owner home:',e); return error(res, e.message, 500); }
});

module.exports = router;

/*
 * /api/v1/widgets/* — the dashboard widgets API (F2, PLATFORM_STANDARDS.md §9).
 * This is the start of registry #18 (Reports & Dashboards Engine): every role
 * dashboard reads its widgets from here, and every widget response answers the
 * four questions of the widget philosophy (§1):
 *   primary_metric (what happened) · secondary_metric (why) ·
 *   action (what requires action) · drill_down (where do I go)
 * Versioning: locked under /api/v1 — no breaking change without /api/v2.
 */
'use strict';
const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { parseListParams, istToday, isElevated } = require('./params');
const { getActiveSchool } = require('../../utils/activeSchool');
// One definition of "leave awaiting approval", shared with /home/admin's Pending
// Approvals card and the Leaves module — the AI insight below and that card used
// to run different predicates and contradict each other (QA round-5).
const { PENDING_LEAVE_SQL } = require('../hrms/leaves/leaveService');
// One definition of topic accuracy / confidence / label, shared with the Weak
// Areas page — see utils/weakArea.js (QA round-7: same engine, two numbers).
const weakArea = require('../../utils/weakArea');

router.use(authenticate);
// Finance/staff widgets (KPIs, fee aging, staff, org analytics) must not be
// readable by student/parent — applied per-route below. Student widgets + the
// school-public ones (attendance/today, exams/upcoming) stay open.
const wStaff = requireRole('owner', 'admin', 'principal', 'coordinator', 'academic_coordinator', 'hod', 'accountant', 'super_admin', 'system_admin');

router.get('/_contract', (req, res) =>
  success(res, {
    version: 'v1',
    params: ['page', 'limit', 'sort', 'order', 'search', 'status', 'date_from', 'date_to',
             'class_id', 'section_id', 'subject_id', 'teacher_id', 'student_id', 'academic_year', 'term'],
    shape: ['primary_metric', 'secondary_metric', 'action', 'drill_down', 'data'],
  }));

/*
 * GET /api/v1/widgets/attendance/today — the reference widget (standards §1
 * worked example; Principal §2 class-wise view).
 * Elevated roles: whole school. Teachers: only their timetable sections.
 */
router.get('/attendance/today', async (req, res) => {
  try {
    const o = req.user.org_id;
    const today = istToday();
    const teacherFilter = isElevated(req) ? '' :
      ` AND s.id IN (SELECT DISTINCT ts.section_id FROM client_timetable_slots ts
                      WHERE ts.org_id=? AND ts.teacher_id=?)`;
    // Multi-branch: only this branch's sections in the class-status list. null → unchanged.
    const activeSchool = await getActiveSchool(req);
    const branchFilter = activeSchool ? ' AND s.school_id=?' : '';

    // ? order: strength(org) → sessions(org, today) → sections(org) [→ branch] [→ teacher(org, uid)]
    const params = [o, o, today, o];
    if (activeSchool) params.push(activeSchool);
    if (!isElevated(req)) params.push(o, req.user.user_id);
    const rows = await query(
      `SELECT s.id AS section_id, cl.name AS class_name, s.name AS section_name,
              (SELECT COUNT(*) FROM client_enrollments e
                WHERE e.section_id=s.id AND e.org_id=? AND e.status='active') AS strength,
              COALESCE(m.marked, 0) AS marked, COALESCE(m.present, 0) AS present
         FROM client_sections s
         JOIN client_classes cl ON cl.id=s.class_id
         LEFT JOIN (
            SELECT ses.section_id,
                   COUNT(ar.id) AS marked,
                   SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) AS present
              FROM client_attendance_sessions ses
              JOIN client_attendance_records ar ON ar.session_id=ses.id
             WHERE ses.org_id=? AND ses.date=?
             GROUP BY ses.section_id
         ) m ON m.section_id=s.id
        WHERE s.org_id=?${branchFilter} ${teacherFilter}
        ORDER BY cl.name, s.name`,
      params
    );

    const perClass = rows.map(r => {
      const strength = Number(r.strength) || 0;
      const marked = Number(r.marked) || 0;
      const status = strength === 0 ? 'no_students'
        : marked === 0 ? 'not_marked'
        : marked >= strength ? 'completed' : 'pending';
      return {
        section_id: r.section_id,
        label: `${r.class_name}${r.section_name ? ` - ${r.section_name}` : ''}`,
        strength, marked, present: Number(r.present) || 0,
        pending: Math.max(0, strength - marked), status,
      };
    }).filter(r => r.status !== 'no_students');

    const totMarked = perClass.reduce((s, r) => s + r.marked, 0);
    const totPresent = perClass.reduce((s, r) => s + r.present, 0);
    const pct = totMarked ? Math.round((totPresent / totMarked) * 100) : null;

    // "Why": same weekday last week, org-wide.
    let lastWeekPct = null;
    try {
      const lw = await queryOne(
        `SELECT COUNT(ar.id) AS marked,
                SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) AS present
           FROM client_attendance_sessions ses
           JOIN client_attendance_records ar ON ar.session_id=ses.id
          WHERE ses.org_id=? AND ses.date=?`, [o, istToday(7)]);
      if (lw && Number(lw.marked) > 0) lastWeekPct = Math.round((Number(lw.present) / Number(lw.marked)) * 100);
    } catch { /* trend is optional */ }

    const attention = perClass.filter(r => r.status !== 'completed');
    const worst = attention[0] || null;

    return success(res, {
      primary_metric: pct === null ? 'Not marked yet' : `${pct}% present today`,
      secondary_metric: pct !== null && lastWeekPct !== null
        ? `${pct - lastWeekPct >= 0 ? '↑' : '↓'} ${Math.abs(pct - lastWeekPct)}% vs last week` : null,
      action: attention.length ? { count: attention.length, label: `${attention.length} class${attention.length === 1 ? '' : 'es'} pending` } : null,
      drill_down: worst ? { label: worst.label, section_id: worst.section_id } : null,
      data: { date: today, per_class: perClass, present_pct: pct, last_week_pct: lastWeekPct },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/exams/upcoming — upcoming/ongoing exams with the
 * per-subject datesheet (Parent §6, Principal §7 Exam tab). Exam schedules are
 * school-public: every authenticated role may read, org-scoped.
 */
router.get('/exams/upcoming', async (req, res) => {
  try {
    const o = req.user.org_id;
    const today = istToday();
    const exams = await query(
      `SELECT e.id, e.name, e.exam_type, e.academic_year, e.status,
              DATE_FORMAT(e.start_date,'%Y-%m-%d') AS start_date,
              DATE_FORMAT(e.end_date,'%Y-%m-%d') AS end_date
         FROM client_exams e
        WHERE e.org_id=? AND COALESCE(e.end_date, e.start_date) >= ?
          AND (e.status IS NULL OR e.status NOT IN ('draft','cancelled'))
        ORDER BY e.start_date ASC
        LIMIT 10`, [o, today]);
    let datesheet = [];
    if (exams.length) {
      const ph = exams.map(() => '?').join(',');
      datesheet = await query(
        `SELECT es.exam_id, es.max_marks, es.duration_mins, es.exam_time,
                DATE_FORMAT(es.exam_date,'%Y-%m-%d') AS exam_date,
                s.name AS subject_name
           FROM client_exam_subjects es
           JOIN client_subjects s ON s.id=es.subject_id
          WHERE es.org_id=? AND es.exam_id IN (${ph})
          ORDER BY es.exam_date ASC, es.exam_time ASC`, [o, ...exams.map(e => e.id)]);
    }
    const next = exams[0] || null;
    return success(res, {
      primary_metric: next ? next.name : 'No upcoming exams',
      secondary_metric: next?.start_date ? `Starting ${next.start_date}` : null,
      action: exams.length ? { count: exams.length, label: `${exams.length} exam${exams.length === 1 ? '' : 's'} scheduled` } : null,
      drill_down: next ? { label: 'View Datesheet', exam_id: next.id } : null,
      data: { exams, datesheet },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/staff/today — staff availability today (Principal §2 Tab 1).
 * Honest live data: approved leaves covering today + pending staff leave count.
 * Full Present/Absent/Late arrives with registry #08 (staff attendance module).
 */
router.get('/staff/today', wStaff, async (req, res) => {
  try {
    if (!isElevated(req)) return error(res, 'Forbidden', 403);
    const o = req.user.org_id;
    const today = istToday();
    // Multi-branch: count/list only this branch's staff (client_user_schools membership).
    const activeSchool = await getActiveSchool(req);
    const staffBranch = activeSchool ? ' AND u.id IN (SELECT user_id FROM client_user_schools WHERE org_id=? AND school_id=?)' : '';
    const onLeave = await query(
      `SELECT lr.id, lr.leave_type_slug, DATE_FORMAT(lr.from_date,'%Y-%m-%d') AS from_date,
              DATE_FORMAT(lr.to_date,'%Y-%m-%d') AS to_date,
              CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name, u.designation
         FROM client_leave_requests lr
         JOIN client_users u ON u.id=lr.applicant_user_id
        WHERE lr.org_id=? AND lr.applicant_type<>'student' AND lr.status='approved'
          AND ? BETWEEN lr.from_date AND lr.to_date${staffBranch}
        ORDER BY u.first_name LIMIT 50`, activeSchool ? [o, today, o, activeSchool] : [o, today]);
    const pending = await queryOne(
      `SELECT COUNT(*) AS c FROM client_leave_requests
        WHERE org_id=? AND applicant_type<>'student' AND ${PENDING_LEAVE_SQL}`, [o]);
    const staffTotal = await queryOne(
      `SELECT COUNT(DISTINCT ur.user_id) AS c
         FROM client_user_roles ur
         JOIN client_roles r ON r.id=ur.role_id
         JOIN client_users u ON u.id=ur.user_id
        WHERE u.org_id=? AND u.is_active=1 AND r.slug NOT IN ('student','parent')${staffBranch}`,
      activeSchool ? [o, o, activeSchool] : [o]).catch(() => null);
    const total = Number(staffTotal?.c) || 0;
    return success(res, {
      primary_metric: total ? `${Math.max(0, total - onLeave.length)}/${total} staff available` : `${onLeave.length} on leave today`,
      secondary_metric: `${onLeave.length} on approved leave today`,
      action: Number(pending?.c) ? { count: Number(pending.c), label: `${pending.c} leave request${Number(pending.c) === 1 ? '' : 's'} awaiting approval` } : null,
      drill_down: { label: 'Manage leave requests', href: '/admin/leaves' },
      data: { on_leave: onLeave, pending_leaves: Number(pending?.c) || 0, staff_total: total },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/kpis — the admin/principal KPI row with LIVE deltas
 * (Admin spec §1: "value plus delta", every number drills down). Replaces the
 * dashboards' hardcoded trend percentages.
 */
router.get('/kpis', wStaff, async (req, res) => {
  try {
    if (!isElevated(req)) return error(res, 'Forbidden', 403);
    const o = req.user.org_id;
    const today = istToday();
    const monthStart = today.slice(0, 8) + '01';
    const pctChange = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : (cur > 0 ? 100 : 0));
    // Multi-branch: scope the headline KPIs to the active branch. Students/classes/
    // sections via school_id; staff via client_user_schools membership. null → unchanged.
    const activeSchool = await getActiveSchool(req);
    const stuBranch = activeSchool ? ' AND s.school_id=?' : '';
    const staffBranch = activeSchool ? ' AND u.id IN (SELECT user_id FROM client_user_schools WHERE org_id=? AND school_id=?)' : '';

    // A1 Universal Filter Bar — optional class/section scope + date window.
    // Staff/classes stay org-wide (class scope is meaningless for them).
    const p = parseListParams(req);
    const scoped = !!(p.classId || p.sectionId);
    let scopeCond = ''; const scopeParams = [];
    if (p.classId)   { scopeCond += ' AND sc.class_id=?'; scopeParams.push(p.classId); }
    if (p.sectionId) { scopeCond += ' AND sc.id=?';       scopeParams.push(p.sectionId); }
    // Revenue window: explicit date range wins over the default this-month view;
    // the comparison window is the equal-length period immediately before it.
    const hasRange = !!(p.dateFrom && p.dateTo && p.dateFrom <= p.dateTo);
    const rangeDays = hasRange
      ? Math.floor((new Date(p.dateTo + 'T00:00:00Z') - new Date(p.dateFrom + 'T00:00:00Z')) / 86400000) + 1
      : null;
    const feeScopeJoin = scoped
      ? `JOIN client_fee_assignments fa ON fa.id=fp.fee_assignment_id
         JOIN client_enrollments fe ON fe.student_id=fa.student_id AND fe.status='active'
         JOIN client_sections sc ON sc.id=fe.section_id`
      : '';

    const [students, staff, classes, revenue, attToday, attLastWeek, feeToday, feeYesterday] = await Promise.all([
      // "Total students" KPI — THE canonical count (client_users.is_active = 1;
      // archiving a student sets it to 0). Definition lives in
      // modules/erp/students.controller.js → stats(). This query used to be a
      // bare COUNT(*) over client_students with no is_active join, so the KPI
      // read 25 while "School at a glance" (which does join) read 24 — one
      // archived student, two contradicting numbers on one screen (QA round-5).
      // The scoped variant keeps its enrollment join because a class/section
      // FILTER genuinely requires an enrollment; COUNT(DISTINCT s.id) stops a
      // two-section student from being counted twice.
      scoped
        ? queryOne(
            `SELECT COUNT(DISTINCT s.id) AS total,
                    COUNT(DISTINCT CASE WHEN s.created_at >= ? THEN s.id END) AS new_month
               FROM client_students s
               JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id AND u.is_active=1
               JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
               JOIN client_sections sc ON sc.id=e.section_id
              WHERE s.org_id=?${scopeCond}${stuBranch}`, [monthStart, o, ...scopeParams, ...(activeSchool ? [activeSchool] : [])]).catch(() => null)
        : queryOne(
            `SELECT COUNT(*) AS total,
                    SUM(CASE WHEN s.created_at >= ? THEN 1 ELSE 0 END) AS new_month
               FROM client_students s
               JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id AND u.is_active=1
              WHERE s.org_id=?${stuBranch}`, activeSchool ? [monthStart, o, activeSchool] : [monthStart, o]).catch(() => null),
      queryOne(
        `SELECT COUNT(DISTINCT u.id) AS total,
                SUM(CASE WHEN u.created_at >= ? THEN 1 ELSE 0 END) AS new_month
           FROM client_users u
           JOIN client_user_roles ur ON ur.user_id=u.id
           JOIN client_roles r ON r.id=ur.role_id
          WHERE u.org_id=? AND u.is_active=1 AND r.slug NOT IN ('student','parent')${staffBranch}`, activeSchool ? [monthStart, o, o, activeSchool] : [monthStart, o]).catch(() => null),
      queryOne(
        `SELECT (SELECT COUNT(*) FROM client_classes WHERE org_id=?${activeSchool ? ' AND school_id=?' : ''}) AS classes,
                (SELECT COUNT(*) FROM client_sections WHERE org_id=?${activeSchool ? ' AND school_id=?' : ''}) AS sections`, activeSchool ? [o, activeSchool, o, activeSchool] : [o, o]).catch(() => null),
      hasRange
        ? queryOne(
            `SELECT COALESCE(SUM(CASE WHEN fp.payment_date BETWEEN ? AND ? THEN fp.amount END),0) AS this_month,
                    COALESCE(SUM(CASE WHEN fp.payment_date >= DATE_SUB(?, INTERVAL ? DAY) AND fp.payment_date < ? THEN fp.amount END),0) AS last_month
               FROM client_fee_payments fp ${feeScopeJoin}
              WHERE fp.org_id=?${scopeCond ? scopeCond : ''}`,
            [p.dateFrom, p.dateTo, p.dateFrom, rangeDays, p.dateFrom, o, ...scopeParams]).catch(() => null)
        : queryOne(
            `SELECT COALESCE(SUM(CASE WHEN fp.payment_date >= ? THEN fp.amount END),0) AS this_month,
                    COALESCE(SUM(CASE WHEN fp.payment_date >= DATE_SUB(?, INTERVAL 1 MONTH) AND fp.payment_date < ? THEN fp.amount END),0) AS last_month
               FROM client_fee_payments fp ${feeScopeJoin}
              WHERE fp.org_id=?${scopeCond ? scopeCond : ''}`,
            [monthStart, monthStart, monthStart, o, ...scopeParams]).catch(() => null),
      queryOne(
        `SELECT COUNT(ar.id) AS marked, SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) AS present
           FROM client_attendance_sessions ses JOIN client_attendance_records ar ON ar.session_id=ses.id
           ${scoped ? 'JOIN client_sections sc ON sc.id=ses.section_id' : ''}
          WHERE ses.org_id=? AND ses.date=?${scopeCond}`, [o, today, ...scopeParams]).catch(() => null),
      queryOne(
        `SELECT COUNT(ar.id) AS marked, SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) AS present
           FROM client_attendance_sessions ses JOIN client_attendance_records ar ON ar.session_id=ses.id
           ${scoped ? 'JOIN client_sections sc ON sc.id=ses.section_id' : ''}
          WHERE ses.org_id=? AND ses.date=?${scopeCond}`, [o, istToday(7), ...scopeParams]).catch(() => null),
      queryOne(`SELECT COALESCE(SUM(fp.amount),0) AS v FROM client_fee_payments fp ${feeScopeJoin} WHERE fp.org_id=? AND fp.status='completed' AND fp.payment_date=?${scopeCond}`, [o, today, ...scopeParams]).catch(() => null),
      queryOne(`SELECT COALESCE(SUM(fp.amount),0) AS v FROM client_fee_payments fp ${feeScopeJoin} WHERE fp.org_id=? AND fp.status='completed' AND fp.payment_date=?${scopeCond}`, [o, istToday(1), ...scopeParams]).catch(() => null),
    ]);

    const stuTotal = Number(students?.total) || 0, stuNew = Number(students?.new_month) || 0;
    const staffTotal = Number(staff?.total) || 0, staffNew = Number(staff?.new_month) || 0;
    const revCur = Number(revenue?.this_month) || 0, revPrev = Number(revenue?.last_month) || 0;
    const attPct = Number(attToday?.marked) ? Math.round((Number(attToday.present) / Number(attToday.marked)) * 100) : null;
    const attPrevPct = Number(attLastWeek?.marked) ? Math.round((Number(attLastWeek.present) / Number(attLastWeek.marked)) * 100) : null;

    return success(res, {
      students: { value: stuTotal, delta_label: `+${stuNew} this month`, delta_pct: pctChange(stuTotal, stuTotal - stuNew) },
      staff: { value: staffTotal, delta_label: `+${staffNew} this month`, delta_pct: pctChange(staffTotal, staffTotal - staffNew) },
      classes: { value: Number(classes?.classes) || 0, sections: Number(classes?.sections) || 0 },
      revenue_month: { value: revCur, delta_pct: pctChange(revCur, revPrev) },
      attendance_today: { pct: attPct, delta_pct: attPct !== null && attPrevPct !== null ? Math.round((attPct - attPrevPct) * 10) / 10 : null },
      fee_today: { value: Number(feeToday?.v) || 0, delta_pct: pctChange(Number(feeToday?.v) || 0, Number(feeYesterday?.v) || 0) },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/fees/aging — outstanding fees in industry-standard aging
 * buckets 0–30 / 31–60 / 61–90 / 90+ days (Admin spec §3), plus the top
 * overdue students for the drill-down.
 */
router.get('/fees/aging', wStaff, async (req, res) => {
  try {
    if (!isElevated(req)) return error(res, 'Forbidden', 403);
    const o = req.user.org_id;
    const today = istToday();
    const base = (dueExpr) => `
      SELECT fa.student_id, ${dueExpr} AS due_on,
             (fa.final_amount - COALESCE((SELECT SUM(fp.amount) FROM client_fee_payments fp WHERE fp.fee_assignment_id=fa.id AND fp.status='completed'),0)) AS pending
        FROM client_fee_assignments fa
       WHERE fa.org_id=?`;
    let rows;
    try { rows = await query(base('COALESCE(fa.due_date, fa.assigned_date)'), [o]); }
    catch { rows = await query(base('fa.assigned_date'), [o]); }

    const buckets = { '0-30': { amount: 0, students: new Set() }, '31-60': { amount: 0, students: new Set() },
                      '61-90': { amount: 0, students: new Set() }, '90+': { amount: 0, students: new Set() } };
    const perStudent = new Map();
    const t = new Date(today + 'T00:00:00Z').getTime();
    for (const r of rows) {
      const pending = Number(r.pending) || 0;
      if (pending <= 0 || !r.due_on) continue;
      const days = Math.floor((t - new Date(String(r.due_on).slice(0, 10) + 'T00:00:00Z').getTime()) / 86400000);
      if (days <= 0) continue; // not yet due
      const b = days <= 30 ? '0-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : '90+';
      buckets[b].amount += pending;
      buckets[b].students.add(r.student_id);
      perStudent.set(r.student_id, (perStudent.get(r.student_id) || 0) + pending);
    }
    const totalOverdue = Object.values(buckets).reduce((s, b) => s + b.amount, 0);
    const overdueStudents = perStudent.size;

    let top = [];
    if (overdueStudents) {
      const ids = [...perStudent.keys()].sort((a, b) => perStudent.get(b) - perStudent.get(a)).slice(0, 10);
      const ph = ids.map(() => '?').join(',');
      const info = await query(
        `SELECT s.id, s.admission_number, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name,
                cl.name AS class_name, sec.name AS section_name
           FROM client_students s JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id
           LEFT JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
           LEFT JOIN client_sections sec ON sec.id=e.section_id
           LEFT JOIN client_classes cl ON cl.id=sec.class_id
          WHERE s.org_id=? AND s.id IN (${ph})`, [o, ...ids]).catch(() => []);
      top = ids.map(id => {
        const s = info.find(x => x.id === id);
        return { student_id: id, name: s?.name || `#${id}`, admission_number: s?.admission_number,
                 class_label: s?.class_name ? `${s.class_name}${s.section_name ? ` - ${s.section_name}` : ''}` : null,
                 pending: Math.round(perStudent.get(id)) };
      });
    }

    return success(res, {
      primary_metric: `₹${Math.round(totalOverdue).toLocaleString('en-IN')} overdue`,
      secondary_metric: `${overdueStudents} student${overdueStudents === 1 ? '' : 's'} with overdue payments`,
      action: buckets['90+'].amount > 0 ? { label: `₹${Math.round(buckets['90+'].amount).toLocaleString('en-IN')} older than 90 days` } : null,
      drill_down: { label: 'Open Fees', href: '/admin/fees' },
      data: {
        buckets: Object.fromEntries(Object.entries(buckets).map(([k, b]) => [k, { amount: Math.round(b.amount), students: b.students.size }])),
        top_overdue: top,
      },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/students/analytics — Student Analytics (Admin spec §2):
 * gender/stream/board distributions ("Not set" bucket until backfilled),
 * monthly admission trend, class strength, top performing class.
 */
router.get('/students/analytics', wStaff, async (req, res) => {
  try {
    if (!isElevated(req)) return error(res, 'Forbidden', 403);
    const o = req.user.org_id;
    const monthStart = istToday().slice(0, 8) + '01';
    // Multi-branch: scope every panel of this widget to the active branch. Students
    // via s.school_id, sections via sec.school_id, weak-areas/attendance via a
    // student/section subquery. null → unchanged (single-branch orgs).
    const activeSchool = await getActiveSchool(req);
    const sBranch = activeSchool ? ' AND s.school_id=?' : '';
    const secBranch = activeSchool ? ' AND sec.school_id=?' : '';
    const bp = activeSchool ? [activeSchool] : [];

    // Every distribution slices the SAME population the Total-Students KPI
    // counts — current students (client_users.is_active = 1). Without the join
    // the gender/stream splits summed to more than the headline total.
    const dist = async (col, table = 's') => {
      const sqls = table === 's'
        ? `SELECT COALESCE(NULLIF(TRIM(s.${col}),''),'not_set') AS k, COUNT(*) c
             FROM client_students s JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id AND u.is_active=1
            WHERE s.org_id=?${sBranch} GROUP BY k`
        : `SELECT COALESCE(NULLIF(TRIM(u.gender),''),'not_set') AS k, COUNT(*) c
             FROM client_students s JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id AND u.is_active=1
            WHERE s.org_id=?${sBranch} GROUP BY k`;
      try { return (await query(sqls, [o, ...bp])).map(r => ({ key: r.k, count: Number(r.c) })); }
      catch { return []; }
    };
    // gender lives on client_students in some schemas, client_users in others — merge.
    let gender = await dist('gender', 's');
    if (!gender.length || gender.every(g => g.key === 'not_set')) {
      const fromUsers = await dist('gender', 'u');
      if (fromUsers.length) gender = fromUsers;
    }

    const [stream, board, trend, strength, topClass, newMonth, atRisk, attToday] = await Promise.all([
      dist('stream'), dist('board'),
      query(
        // same "current student" population as new_this_month below, so the trend
        // and the headline number can't tell different stories
        `SELECT DATE_FORMAT(s.created_at,'%Y-%m') AS month, COUNT(*) c
           FROM client_students s
           JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id AND u.is_active=1
          WHERE s.org_id=? AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)${sBranch}
          GROUP BY month ORDER BY month`, [o, ...bp]).catch(() => []),
      query(
        `SELECT cl.name AS class_name, sec.name AS section_name,
                COUNT(e.id) AS strength
           FROM client_sections sec
           JOIN client_classes cl ON cl.id=sec.class_id
           LEFT JOIN client_enrollments e ON e.section_id=sec.id AND e.status='active'
          WHERE sec.org_id=?${secBranch}
          GROUP BY sec.id, cl.name, sec.name ORDER BY cl.name, sec.name`, [o, ...bp]).catch(() => []),
      queryOne(
        `SELECT cl.name AS class_name, ROUND(AVG(m.marks_obtained / NULLIF(es.max_marks,0) * 100),1) AS avg_pct
           FROM client_exam_marks m
           JOIN client_exam_subjects es ON es.id=m.exam_subject_id
           JOIN client_enrollments e ON e.student_id=m.student_id AND e.status='active'
           JOIN client_sections sec ON sec.id=e.section_id
           JOIN client_classes cl ON cl.id=sec.class_id
          WHERE m.org_id=? AND m.is_absent=0${secBranch}
          GROUP BY cl.id, cl.name ORDER BY avg_pct DESC LIMIT 1`, [o, ...bp]).catch(() => null),
      // "New admissions this month" is a TIME WINDOW over the same population the
      // Students page header and the Total Students KPI count — a current student
      // (client_users.is_active = 1; archiving sets it to 0). See the canonical
      // definition in modules/erp/students.controller.js → stats(). Without this
      // join an added-then-removed student stayed counted here forever, so the
      // three counters on the Students screen disagreed (QA round-4).
      queryOne(
        `SELECT COUNT(*) c FROM client_students s
           JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id AND u.is_active=1
          WHERE s.org_id=? AND s.created_at >= ?${sBranch}`, [o, monthStart, ...bp]).catch(() => null),
      // At-Risk (Principal §11.2, AI rules §22 — grounded in the weak-area engine)
      queryOne(
        `SELECT COUNT(DISTINCT student_id) c FROM client_student_weak_areas
          WHERE org_id=? AND level='topic' AND severity IN ('critical','weak')${activeSchool ? ' AND student_id IN (SELECT id FROM client_students WHERE org_id=? AND school_id=?)' : ''}`,
        activeSchool ? [o, o, activeSchool] : [o]).catch(() => null),
      queryOne(
        `SELECT COUNT(ar.id) marked, SUM(ar.status='present') present
           FROM client_attendance_sessions ses JOIN client_attendance_records ar ON ar.session_id=ses.id
          WHERE ses.org_id=? AND ses.date=?${activeSchool ? ' AND ses.section_id IN (SELECT id FROM client_sections WHERE org_id=? AND school_id=?)' : ''}`,
        activeSchool ? [o, istToday(), o, activeSchool] : [o, istToday()]).catch(() => null),
    ]);

    const attTodayPct = attToday && Number(attToday.marked)
      ? Math.round((Number(attToday.present) / Number(attToday.marked)) * 100) : null;

    return success(res, {
      primary_metric: `${Number(newMonth?.c) || 0} new admissions this month`,
      secondary_metric: topClass ? `Top class: ${topClass.class_name} (${topClass.avg_pct}% avg)` : null,
      action: null,
      drill_down: { label: 'Open Students', href: '/admin/students' },
      data: {
        gender, stream, board,
        admission_trend: trend.map(t => ({ month: t.month, count: Number(t.c) })),
        class_strength: strength.map(r => ({
          label: `${r.class_name}${r.section_name ? ` - ${r.section_name}` : ''}`,
          strength: Number(r.strength) || 0,
        })),
        top_class: topClass || null,
        new_this_month: Number(newMonth?.c) || 0,
        at_risk: Number(atRisk?.c) || 0,
        attendance_today_pct: attTodayPct,
      },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/student/quiz-analytics — the logged-in student's quiz
 * analytics (Student spec §12): attempt history, highest/average, time taken,
 * improvement trend, and SECTION-scoped rank + percentile (decision D2 —
 * same teacher/paper = fair comparison). Student-scoped: own data only.
 */
router.get('/student/quiz-analytics', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const student = await queryOne(
      `SELECT s.id FROM client_students s WHERE s.user_id=? AND s.org_id=?`, [uid, o]);
    if (!student) return error(res, 'Student profile not found', 404);
    const sid = student.id;

    const attempts = await query(
      `SELECT a.id, a.quiz_id, q.title, a.percentage, a.score, q.total_marks,
              DATE_FORMAT(a.submitted_at,'%Y-%m-%d') AS submitted_on,
              (SELECT COALESCE(SUM(ans.time_spent_seconds),0) FROM client_quiz_answers ans WHERE ans.attempt_id=a.id) AS time_seconds
         FROM client_quiz_attempts a
         JOIN client_quizzes q ON q.id=a.quiz_id
        WHERE a.student_id=? AND a.org_id=? AND a.status IN ('submitted','graded')
        ORDER BY a.submitted_at ASC LIMIT 50`, [sid, o]);

    const pcts = attempts.map(a => Number(a.percentage) || 0);
    const highest = pcts.length ? Math.max(...pcts) : null;
    const average = pcts.length ? Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length * 10) / 10 : null;

    // Section-scoped rank/percentile on average quiz percentage (D2).
    let rank = null, percentile = null, cohort = 0;
    try {
      const sec = await queryOne(
        `SELECT section_id FROM client_enrollments WHERE student_id=? AND org_id=? AND status='active' LIMIT 1`, [sid, o]);
      if (sec) {
        const peers = await query(
          `SELECT a.student_id, AVG(a.percentage) AS avg_pct
             FROM client_quiz_attempts a
             JOIN client_enrollments e ON e.student_id=a.student_id AND e.status='active' AND e.section_id=?
            WHERE a.org_id=? AND a.status IN ('submitted','graded')
            GROUP BY a.student_id ORDER BY avg_pct DESC`, [sec.section_id, o]);
        cohort = peers.length;
        const idx = peers.findIndex(p => p.student_id === sid);
        if (idx >= 0 && cohort > 0) {
          rank = idx + 1;
          percentile = Math.round(((cohort - rank) / cohort) * 100);
        }
      }
    } catch { /* rank optional */ }

    return success(res, {
      primary_metric: average !== null ? `${average}% average` : 'No attempts yet',
      secondary_metric: highest !== null ? `Best: ${highest}%` : null,
      action: rank !== null ? { label: `Rank ${rank} of ${cohort} in your section` } : null,
      drill_down: { label: 'Open Quizzes', href: '/student/quizzes' },
      data: {
        attempts: attempts.map(a => ({
          id: a.id, quiz_id: a.quiz_id, title: a.title,
          percentage: Number(a.percentage) || 0, score: Number(a.score) || 0,
          total_marks: Number(a.total_marks) || 0, submitted_on: a.submitted_on,
          time_minutes: Math.round((Number(a.time_seconds) || 0) / 60),
        })),
        highest, average, total_attempts: attempts.length,
        rank, percentile, cohort,
        trend: attempts.map(a => ({ x: a.submitted_on, y: Number(a.percentage) || 0 })),
      },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/school-health — the flagship 6-card health summary
 * (Admin spec §8). Every score is derived from live data with explicit
 * thresholds; each card carries its `basis` so the score is explainable.
 */
router.get('/school-health', wStaff, async (req, res) => {
  try {
    if (!isElevated(req)) return error(res, 'Forbidden', 403);
    const o = req.user.org_id;
    const today = istToday();
    const grade = (v, ex, good, warn) => (v == null ? 'needs_attention' : v >= ex ? 'excellent' : v >= good ? 'good' : v >= warn ? 'needs_attention' : 'critical');

    const [att, fees, acad, staff, comm] = await Promise.all([
      queryOne(
        `SELECT COUNT(ar.id) marked, SUM(ar.status='present') present
           FROM client_attendance_sessions ses JOIN client_attendance_records ar ON ar.session_id=ses.id
          WHERE ses.org_id=? AND ses.date >= DATE_SUB(?, INTERVAL 7 DAY)`, [o, today]).catch(() => null),
      queryOne(
        `SELECT COALESCE(SUM(fa.final_amount),0) assigned,
                COALESCE((SELECT SUM(amount) FROM client_fee_payments WHERE org_id=? AND status='completed'),0) collected
           FROM client_fee_assignments fa WHERE fa.org_id=?`, [o, o]).catch(() => null),
      queryOne(
        `SELECT ROUND(AVG(m.marks_obtained / NULLIF(es.max_marks,0) * 100),1) avg_pct
           FROM client_exam_marks m JOIN client_exam_subjects es ON es.id=m.exam_subject_id
          WHERE m.org_id=? AND m.is_absent=0`, [o]).catch(() => null),
      queryOne(
        `SELECT (SELECT COUNT(*) FROM client_leave_requests WHERE org_id=? AND applicant_type<>'student' AND ${PENDING_LEAVE_SQL}) pending,
                (SELECT COUNT(*) FROM client_leave_requests WHERE org_id=? AND applicant_type<>'student' AND status='approved' AND ? BETWEEN from_date AND to_date) on_leave`,
        [o, o, today]).catch(() => null),
      queryOne(
        `SELECT COUNT(*) c FROM announcements WHERE org_id=? AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)`, [o]).catch(() => null),
    ]);

    const attPct = att && Number(att.marked) ? Math.round((Number(att.present) / Number(att.marked)) * 100) : null;
    const collectPct = fees && Number(fees.assigned) ? Math.round((Number(fees.collected) / Number(fees.assigned)) * 100) : null;
    const acadPct = acad?.avg_pct != null ? Number(acad.avg_pct) : null;
    const staffPending = Number(staff?.pending) || 0;
    const commCount = Number(comm?.c) || 0;

    let dbMs = null;
    try { const t0 = Date.now(); await queryOne('SELECT 1'); dbMs = Date.now() - t0; } catch { /* db issue = critical below */ }

    // Hover-preview visualisations per card (premium dashboards, 10-Jul) —
    // each degrades to null independently; the popup simply hides then.
    const [att7, acad5, comm4] = await Promise.all([
      query(
        `SELECT ses.date AS d, ROUND(SUM(ar.status='present')/NULLIF(COUNT(ar.id),0)*100) AS pct
           FROM client_attendance_sessions ses JOIN client_attendance_records ar ON ar.session_id=ses.id
          WHERE ses.org_id=? AND ses.date >= DATE_SUB(?, INTERVAL 7 DAY)
          GROUP BY ses.date ORDER BY ses.date ASC`, [o, today]).catch(() => []),
      query(
        `SELECT e.name AS label, ROUND(AVG(m.marks_obtained / NULLIF(es.max_marks,0) * 100),1) AS pct
           FROM client_exam_marks m
           JOIN client_exam_subjects es ON es.id=m.exam_subject_id
           JOIN client_exams e ON e.id=m.exam_id
          WHERE m.org_id=? AND m.is_absent=0
          GROUP BY e.id, e.name, e.start_date ORDER BY e.start_date DESC LIMIT 5`, [o]).catch(() => []),
      query(
        `SELECT YEARWEEK(created_at) AS wk, COUNT(*) AS c
           FROM announcements WHERE org_id=? AND created_at >= DATE_SUB(NOW(), INTERVAL 28 DAY)
          GROUP BY YEARWEEK(created_at) ORDER BY wk ASC`, [o]).catch(() => []),
    ]);
    const collected = Number(fees?.collected) || 0;
    const assigned = Number(fees?.assigned) || 0;
    const viz = {
      attendance: att7.length
        ? { type: 'bars', unit: '%', points: att7.map(r => ({ label: String(r.d).slice(5, 10), value: Number(r.pct) || 0 })) }
        : null,
      fee: assigned > 0
        ? { type: 'donut', segments: [
            { label: 'Collected', value: collected, color: '#1E7A4D' },
            { label: 'Pending', value: Math.max(0, assigned - collected), color: '#C0392B' },
          ] }
        : null,
      academic: acad5.length
        ? { type: 'line', unit: '%', points: [...acad5].reverse().map(r => ({ label: String(r.label).slice(0, 10), value: Number(r.pct) || 0 })) }
        : null,
      teacher: { type: 'stats', items: [
        { label: 'Pending requests', value: staffPending },
        { label: 'On leave today', value: Number(staff?.on_leave) || 0 },
      ] },
      system: { type: 'stats', items: [
        { label: 'DB ping', value: dbMs == null ? '—' : `${dbMs} ms` },
        { label: 'Status', value: dbMs == null ? 'Unreachable' : dbMs < 200 ? 'Healthy' : 'Slow' },
      ] },
      communication: comm4.length
        ? { type: 'bars', unit: '', points: comm4.map((r, i) => ({ label: `W${i + 1}`, value: Number(r.c) || 0 })) }
        : null,
    };

    const cards = [
      { key: 'attendance', label: 'Attendance Health', score: grade(attPct, 90, 80, 70),
        basis: attPct == null ? 'No attendance marked in the last 7 days' : `${attPct}% present (7-day)` , href: '/admin/attendance' },
      { key: 'fee', label: 'Fee Health', score: grade(collectPct, 90, 70, 50),
        basis: collectPct == null ? 'No fees assigned yet' : `${Math.min(collectPct, 100)}% of assigned fees collected`, href: '/admin/fees' },
      { key: 'academic', label: 'Academic Health', score: grade(acadPct, 75, 60, 45),
        basis: acadPct == null ? 'No graded exams yet' : `${acadPct}% average exam score`, href: '/admin/analytics' },
      { key: 'teacher', label: 'Teacher Health', score: staffPending > 10 ? 'critical' : staffPending > 5 ? 'needs_attention' : staffPending > 0 ? 'good' : 'excellent',
        basis: `${staffPending} staff leave request${staffPending === 1 ? '' : 's'} pending`, href: '/admin/leaves' },
      { key: 'system', label: 'System Health', score: dbMs == null ? 'critical' : dbMs < 50 ? 'excellent' : dbMs < 200 ? 'good' : 'needs_attention',
        basis: dbMs == null ? 'Database unreachable' : `DB responding in ${dbMs}ms`, href: '/admin/settings' },
      { key: 'communication', label: 'Communication Health', score: commCount >= 4 ? 'excellent' : commCount >= 2 ? 'good' : commCount >= 1 ? 'needs_attention' : 'critical',
        basis: `${commCount} announcement${commCount === 1 ? '' : 's'} in the last 14 days`, href: '/admin/announcements' },
    ];
    for (const c of cards) c.viz = viz[c.key] || null;
    const worst = ['critical', 'needs_attention', 'good', 'excellent'].find(s => cards.some(c => c.score === s));
    return success(res, {
      primary_metric: worst === 'excellent' ? 'All systems healthy' : `${cards.filter(c => c.score === 'critical' || c.score === 'needs_attention').length} area(s) need attention`,
      data: { cards },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/insights — AI Insights (Admin spec §9). Deterministic,
 * grounded in live queries (Platform §22: no output without a source, source
 * shown, nothing auto-modified). Each insight deep-links to its drill-down.
 */
router.get('/insights', wStaff, async (req, res) => {
  try {
    if (!isElevated(req)) return error(res, 'Forbidden', 403);
    const o = req.user.org_id;
    const today = istToday();
    const monthStart = today.slice(0, 8) + '01';
    const insights = [];

    // 1. Fee collection vs last month
    try {
      const r = await queryOne(
        `SELECT COALESCE(SUM(CASE WHEN payment_date >= ? THEN amount END),0) cur,
                COALESCE(SUM(CASE WHEN payment_date >= DATE_SUB(?, INTERVAL 1 MONTH) AND payment_date < ? THEN amount END),0) prev
           FROM client_fee_payments WHERE org_id=? AND status='completed'`, [monthStart, monthStart, monthStart, o]);
      const cur = Number(r?.cur) || 0, prev = Number(r?.prev) || 0;
      if (prev > 0) {
        const pct = Math.round(((cur - prev) / prev) * 100);
        if (pct <= -5) insights.push({ text: `Fee collection is down ${Math.abs(pct)}% compared to last month.`, href: '/admin/fees', severity: 'warning', source: 'fee payments, this month vs last' });
        else if (pct >= 10) insights.push({ text: `Fee collection is up ${pct}% compared to last month.`, href: '/admin/fees', severity: 'positive', source: 'fee payments, this month vs last' });
      }
    } catch { /* skip */ }

    // 2. Sections with attendance below 80% (last 7 days)
    try {
      const rows = await query(
        `SELECT cl.name class_name, sec.name section_name,
                ROUND(SUM(ar.status='present')/COUNT(ar.id)*100) pct
           FROM client_attendance_sessions ses
           JOIN client_attendance_records ar ON ar.session_id=ses.id
           JOIN client_sections sec ON sec.id=ses.section_id
           JOIN client_classes cl ON cl.id=sec.class_id
          WHERE ses.org_id=? AND ses.date >= DATE_SUB(?, INTERVAL 7 DAY)
          GROUP BY ses.section_id HAVING pct < 80 ORDER BY pct ASC LIMIT 3`, [o, today]);
      for (const r of rows) insights.push({ text: `${r.class_name}-${r.section_name} attendance has dropped to ${r.pct}% this week.`, href: '/admin/attendance', severity: 'warning', source: 'attendance records, last 7 days' });
    } catch { /* skip */ }

    // 3. Pending leave approvals
    try {
      const r = await queryOne(`SELECT COUNT(*) c FROM client_leave_requests WHERE org_id=? AND ${PENDING_LEAVE_SQL}`, [o]);
      if (Number(r?.c) > 0) insights.push({ text: `${r.c} leave request${Number(r.c) === 1 ? '' : 's'} require approval.`, href: '/admin/leaves', severity: 'action', source: 'leave requests with pending status' });
    } catch { /* skip */ }

    // 4. Content upload gap
    try {
      const r = await queryOne(`SELECT COUNT(*) c FROM client_content_items WHERE org_id=? AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)`, [o]);
      if (Number(r?.c) === 0) insights.push({ text: 'No learning content has been uploaded in the past 14 days.', href: '/admin/content', severity: 'warning', source: 'content items, last 14 days' });
    } catch { /* skip */ }

    // 5. At-risk students (critical/weak areas)
    try {
      const r = await queryOne(
        `SELECT COUNT(DISTINCT student_id) c FROM client_student_weak_areas
          WHERE org_id=? AND level='topic' AND severity IN ('critical','weak')`, [o]);
      if (Number(r?.c) > 0) insights.push({ text: `${r.c} student${Number(r.c) === 1 ? ' is' : 's are'} at risk due to weak areas — recovery worksheets recommended.`, href: '/admin/personalized-learning', severity: 'action', source: 'weak-area engine (critical/weak)' });
    } catch { /* skip */ }

    return success(res, {
      primary_metric: insights.length ? `${insights.length} insight${insights.length === 1 ? '' : 's'}` : 'No alerts — all clear',
      data: { insights },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/teachers/status — teacher availability right now
 * (Principal spec §10.1): today's periods per teacher + who's on approved
 * leave, plus the timetable config so the client computes the live period
 * (same lib/timetable logic as the highlight). Refresh ~15s on the client.
 */
router.get('/teachers/status', wStaff, async (req, res) => {
  try {
    if (!isElevated(req)) return error(res, 'Forbidden', 403);
    const o = req.user.org_id;
    const today = istToday();
    const dayKey = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(today + 'T00:00:00Z').getUTCDay()];

    const [slots, leaves, cfg] = await Promise.all([
      query(
        `SELECT ts.teacher_id, ts.period_number
           FROM client_timetable_slots ts
          WHERE ts.org_id=? AND ts.day_of_week=? AND ts.teacher_id IS NOT NULL`, [o, dayKey]).catch(() => []),
      query(
        `SELECT lr.applicant_user_id AS user_id
           FROM client_leave_requests lr
          WHERE lr.org_id=? AND lr.applicant_type<>'student' AND lr.status='approved'
            AND ? BETWEEN lr.from_date AND lr.to_date`, [o, today]).catch(() => []),
      queryOne('SELECT * FROM client_timetable_config WHERE org_id=?', [o]).catch(() => null),
    ]);

    const byTeacher = {};
    for (const s of slots) {
      (byTeacher[s.teacher_id] = byTeacher[s.teacher_id] || []).push(Number(s.period_number));
    }
    return success(res, {
      data: {
        day: dayKey,
        config: cfg || null,
        days: (cfg?.working_days || 'Mon,Tue,Wed,Thu,Fri,Sat').split(','),
        periods_by_teacher: byTeacher,
        on_leave_user_ids: leaves.map(l => l.user_id),
      },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * Gamification v1 (SUG-0060 §1/§2). Analytics-only per A12 — never
 * disciplinary. All endpoints resolve the student from the token; a student
 * can only ever write their own rows.
 */
const KINDS = new Set(['login', 'worksheet_opened', 'quiz_attempted', 'video_watched', 'homework_viewed', 'download', 'ai_used', 'content_opened']);
const MOODS = new Set(['great', 'good', 'okay', 'low', 'stressed']);

async function ownStudent(req) {
  return queryOne('SELECT id FROM client_students WHERE user_id=? AND org_id=?', [req.user.user_id, req.user.org_id]);
}

// POST /api/v1/widgets/student/activity {kind, ref_id?}
router.post('/student/activity', async (req, res) => {
  try {
    const s = await ownStudent(req);
    if (!s) return error(res, 'Student profile not found', 404);
    const kind = String(req.body?.kind || '');
    if (!KINDS.has(kind)) return error(res, 'Unknown activity kind', 400);
    // 'login' fires on every dashboard mount (see StudentDashboard.tsx) — it
    // marks "was here today" for the streak, not a per-visit action, so it
    // must be idempotent per day (no unique constraint exists on this table
    // to enforce it at the DB level without also capping legitimate
    // multi-per-day kinds like video_watched/quiz_attempted, which each
    // carry a distinct ref_id and should keep earning XP). Every other kind
    // inserts freely, same as before.
    if (kind === 'login') {
      const already = await queryOne(
        `SELECT id FROM client_student_activity WHERE org_id=? AND student_id=? AND kind='login' AND activity_date=?`,
        [req.user.org_id, s.id, istToday()]);
      if (already) return success(res, {});
    }
    await query(
      `INSERT INTO client_student_activity (org_id, student_id, kind, ref_id, activity_date) VALUES (?,?,?,?,?)`,
      [req.user.org_id, s.id, kind, req.body?.ref_id || null, istToday()]);
    return success(res, {});
  } catch (e) {
    if (/doesn't exist/i.test(e.message)) return success(res, {}); // pre-migration: silently no-op
    return error(res, e.message, 500);
  }
});

// POST /api/v1/widgets/student/mood {mood} — one tap per day, last tap wins
router.post('/student/mood', async (req, res) => {
  try {
    const s = await ownStudent(req);
    if (!s) return error(res, 'Student profile not found', 404);
    const mood = String(req.body?.mood || '');
    if (!MOODS.has(mood)) return error(res, 'Unknown mood', 400);
    await query(
      `INSERT INTO client_student_moods (org_id, student_id, mood_date, mood) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE mood=VALUES(mood)`,
      [req.user.org_id, s.id, istToday(), mood]);
    return success(res, { mood });
  } catch (e) {
    if (/doesn't exist/i.test(e.message)) return error(res, 'Mood tracking needs a DB update — run scripts/gamification_migration.js', 500);
    return error(res, e.message, 500);
  }
});

// GET /api/v1/widgets/student/streak — 🔥 consecutive active days, today's
// mood, and XP + achievement tier (§2: earned from real learning actions;
// historical quiz attempts and submissions count so day one isn't zero).
const XP_TIERS = [
  { key: 'master',   min: 2000 }, { key: 'champion', min: 1000 },
  { key: 'gold',     min: 500 },  { key: 'silver',   min: 200 },
  { key: 'bronze',   min: 0 },
];
router.get('/student/streak', async (req, res) => {
  try {
    const s = await ownStudent(req);
    if (!s) return error(res, 'Student profile not found', 404);
    const o = req.user.org_id;
    let streak = 0, mood = null, activityXp = 0;
    // When the activity/mood tables are missing (pre-migration env) the streak
    // is not "0 days" — it is UNKNOWN. Silently reporting 0 is what made a
    // GOLD/635-XP student look like they had never studied. Tell the client.
    let streakAvailable = true;
    try {
      const days = await query(
        `SELECT DISTINCT activity_date FROM client_student_activity
          WHERE org_id=? AND student_id=? ORDER BY activity_date DESC LIMIT 120`, [o, s.id]);
      const set = new Set(days.map(d => String(d.activity_date).slice(0, 10)));
      // streak counts back from today (or yesterday, so it survives a fresh morning)
      let cursor = set.has(istToday()) ? 0 : 1;
      while (set.has(istToday(cursor))) { streak++; cursor++; }
      const m = await queryOne(
        `SELECT mood FROM client_student_moods WHERE student_id=? AND mood_date=?`, [s.id, istToday()]);
      mood = m?.mood || null;
      const a = await queryOne(
        `SELECT SUM(CASE WHEN kind='login' THEN 5 ELSE 15 END) xp
           FROM client_student_activity WHERE org_id=? AND student_id=?`, [o, s.id]);
      activityXp = Number(a?.xp) || 0;
    } catch (e) {
      // Missing gamification tables (scripts/gamification_migration.js not run
      // here) — surface it instead of pretending the streak is a real zero.
      streakAvailable = false;
      console.warn('[widgets.student.streak] activity source unavailable:', e.message);
    }

    const [quizzes, subs] = await Promise.all([
      queryOne(`SELECT COUNT(*) c FROM client_quiz_attempts WHERE org_id=? AND student_id=? AND status IN ('submitted','graded')`, [o, s.id]).catch(() => null),
      queryOne(`SELECT COUNT(*) c FROM client_assignment_submissions WHERE student_id=?`, [s.id]).catch(() => null),
    ]);
    const xp = activityXp + (Number(quizzes?.c) || 0) * 25 + (Number(subs?.c) || 0) * 20 + streak * 10;
    const tier = XP_TIERS.find(t => xp >= t.min)?.key || 'bronze';
    const next = [...XP_TIERS].reverse().find(t => t.min > xp) || null;

    // §26 Study Clock → §2 Daily Progress Ring (goal 120 min for v1)
    let studyMinutes = 0;
    try {
      const st = await queryOne(
        `SELECT minutes FROM client_student_study_time WHERE student_id=? AND study_date=?`, [s.id, istToday()]);
      studyMinutes = Number(st?.minutes) || 0;
    } catch { /* pre-migration */ }

    return success(res, {
      primary_metric: !streakAvailable ? 'Streak tracking unavailable'
        : streak > 0 ? `🔥 ${streak} day streak` : 'Start your streak today',
      data: {
        streak, streak_available: streakAvailable, mood_today: mood, xp, tier,
        // The tier is earned from TOTAL XP (historical quizzes + submissions),
        // not from the streak — so "Gold" next to a 0-day streak is legitimate.
        // The UI must say so rather than showing a bare 0 beside a gold badge.
        tier_source: 'xp',
        next_tier: next ? { key: next.key, needed: next.min - xp } : null,
        study_minutes_today: studyMinutes, study_goal_minutes: 120,
      },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/student/recommendation — the Smart AI widget (§4):
 * grounded in the weak-area engine (never templated), each item deep-links.
 */
router.get('/student/recommendation', async (req, res) => {
  try {
    const s = await ownStudent(req);
    if (!s) return error(res, 'Student profile not found', 404);
    const o = req.user.org_id;
    // level='topic' is MANDATORY: client_student_weak_areas stores the same
    // performance again at chapter and subject level, so an unpinned query
    // showed the student the identical weakness two or three times over — and
    // headlined a SUBJECT row's 50% next to the Weak Areas page's topic rows
    // (QA round 7). Same level, same rows, same numbers as that page now.
    const rows = await query(
      `SELECT COALESCE(t.name, ch.name, sub.name, 'General') AS topic_name,
              sub.name AS subject_name, w.severity,
              w.total_attempts, w.correct_attempts, w.severity_score
         FROM client_student_weak_areas w
         LEFT JOIN client_qb_topics t ON t.id=w.topic_id
         LEFT JOIN client_qb_chapters ch ON ch.id=w.chapter_id
         LEFT JOIN client_qb_subjects sub ON sub.id=w.subject_id
        WHERE w.org_id=? AND w.student_id=? AND w.level='topic'
          AND w.severity IN ('critical','weak','attention')
        ORDER BY FIELD(w.severity,'critical','weak','attention'), w.severity_score DESC
        LIMIT 12`, [o, s.id]).catch(() => []);
    const described = rows.map(w => {
      const d = weakArea.describe({
        severity: w.severity, correct_attempts: w.correct_attempts,
        total_attempts: w.total_attempts, name: w.topic_name,
      });
      return {
        topic: w.topic_name, subject: w.subject_name, severity: w.severity,
        status: d.status, confidence: d.confidence, attempts: d.attempts,
        accuracy: d.accuracy, label: d.label, headline: d.headline,
        actions: [
          { label: 'Practice Worksheet', href: '/student/personalized-learning/worksheets' },
          { label: 'Revise', href: '/student/learn-hub' },
          { label: 'Attempt Quiz', href: '/student/quizzes' },
        ],
      };
    });
    // Proven weaknesses first; a 1-question topic is shown as "not enough
    // practice", never dressed up as a weakness.
    const proven = described.filter(i => i.status === 'critical' || i.status === 'weak' || i.status === 'attention');
    const unproven = described.filter(i => i.status === 'unproven');
    const items = [...proven, ...unproven].slice(0, 3);
    return success(res, {
      primary_metric: proven.length ? proven[0].headline
        : unproven.length ? 'Not enough practice yet to spot a weak area'
        : 'No weak areas detected — keep it up! 🎉',
      data: { items, source: 'weak-area engine (quiz + exam performance)' },
    });
  } catch (e) { return error(res, e.message, 500); }
});



/*
 * GET /api/v1/widgets/student/recent — Continue Learning + recently opened
 * (SUG-0060 §3/§8): the student's last opened content/worksheets resolved to
 * titles with resume links. Own-data only.
 */
router.get('/student/recent', async (req, res) => {
  try {
    const s = await ownStudent(req);
    if (!s) return error(res, 'Student profile not found', 404);
    const o = req.user.org_id;
    let rows = [];
    try {
      rows = await query(
        `SELECT a.kind, a.ref_id, MAX(a.created_at) AS last_at
           FROM client_student_activity a
          WHERE a.org_id=? AND a.student_id=? AND a.kind IN ('content_opened','worksheet_opened') AND a.ref_id IS NOT NULL
          GROUP BY a.kind, a.ref_id
          ORDER BY last_at DESC LIMIT 6`, [o, s.id]);
    } catch { /* pre-migration */ }

    const items = [];
    for (const r of rows) {
      try {
        if (r.kind === 'content_opened') {
          const c = await queryOne(`SELECT id, title, type FROM client_content_items WHERE id=? AND org_id=?`, [r.ref_id, o]);
          if (c) items.push({ kind: 'content', id: c.id, title: c.title, type: c.type, href: '/student/learn', last_at: r.last_at });
        } else {
          const w = await queryOne(`SELECT id, title FROM client_recovery_worksheets WHERE id=? AND org_id=?`, [r.ref_id, o]).catch(() => null);
          items.push({ kind: 'worksheet', id: r.ref_id, title: w?.title || 'Worksheet', type: 'worksheet',
                       href: `/student/personalized-learning/worksheets/${r.ref_id}`, last_at: r.last_at });
        }
      } catch { /* skip unresolvable */ }
    }
    return success(res, {
      primary_metric: items.length ? `Continue: ${items[0].title}` : 'Nothing in progress yet',
      data: { items },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * Bookmarks (SUG-0060 §8) — toggle + list, own-data only.
 */
const BOOKMARK_KINDS = new Set(['content', 'worksheet', 'quiz', 'book']);

// POST /api/v1/widgets/student/bookmark {kind, ref_id} → toggles; returns {bookmarked}
router.post('/student/bookmark', async (req, res) => {
  try {
    const s = await ownStudent(req);
    if (!s) return error(res, 'Student profile not found', 404);
    const kind = String(req.body?.kind || '');
    const refId = Number(req.body?.ref_id);
    if (!BOOKMARK_KINDS.has(kind) || !refId) return error(res, 'kind and ref_id required', 400);
    const existing = await queryOne(
      `SELECT id FROM client_student_bookmarks WHERE student_id=? AND kind=? AND ref_id=?`, [s.id, kind, refId]);
    if (existing) {
      await query(`DELETE FROM client_student_bookmarks WHERE id=?`, [existing.id]);
      return success(res, { bookmarked: false });
    }
    await query(
      `INSERT INTO client_student_bookmarks (org_id, student_id, kind, ref_id) VALUES (?,?,?,?)`,
      [req.user.org_id, s.id, kind, refId]);
    return success(res, { bookmarked: true });
  } catch (e) {
    if (/doesn't exist/i.test(e.message)) return error(res, 'Bookmarks need a DB update — run scripts/bookmarks_migration.js', 500);
    return error(res, e.message, 500);
  }
});

// GET /api/v1/widgets/student/bookmarks — the student's saved item ids by kind
router.get('/student/bookmarks', async (req, res) => {
  try {
    const s = await ownStudent(req);
    if (!s) return error(res, 'Student profile not found', 404);
    let rows = [];
    try {
      rows = await query(
        `SELECT kind, ref_id FROM client_student_bookmarks WHERE student_id=? ORDER BY created_at DESC LIMIT 200`, [s.id]);
    } catch { /* pre-migration */ }
    const byKind = {};
    for (const r of rows) (byKind[r.kind] = byKind[r.kind] || []).push(r.ref_id);
    return success(res, { data: { by_kind: byKind, total: rows.length } });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/student/history — Learning History timeline (§8):
 * the student's own activity grouped by day, resolved to friendly lines.
 */
router.get('/student/history', async (req, res) => {
  try {
    const s = await ownStudent(req);
    if (!s) return error(res, 'Student profile not found', 404);
    const o = req.user.org_id;
    let rows = [];
    try {
      rows = await query(
        `SELECT kind, ref_id, DATE_FORMAT(activity_date,'%Y-%m-%d') AS day,
                DATE_FORMAT(created_at,'%H:%i') AS at_time
           FROM client_student_activity
          WHERE org_id=? AND student_id=? AND kind <> 'login'
          ORDER BY created_at DESC LIMIT 60`, [o, s.id]);
    } catch { /* pre-migration */ }

    const LABEL = {
      content_opened: 'Opened content', worksheet_opened: 'Opened worksheet',
      quiz_attempted: 'Completed quiz', video_watched: 'Watched video',
      homework_viewed: 'Viewed homework', download: 'Downloaded', ai_used: 'Used AI tutor',
    };
    const titleCache = new Map();
    const resolveTitle = async (kind, refId) => {
      if (!refId) return null;
      const key = `${kind}:${refId}`;
      if (titleCache.has(key)) return titleCache.get(key);
      let t = null;
      try {
        if (kind === 'content_opened') t = (await queryOne(`SELECT title FROM client_content_items WHERE id=? AND org_id=?`, [refId, o]))?.title;
        else if (kind === 'worksheet_opened') t = (await queryOne(`SELECT title FROM client_recovery_worksheets WHERE id=? AND org_id=?`, [refId, o]))?.title;
        else if (kind === 'quiz_attempted') t = (await queryOne(`SELECT title FROM client_quizzes WHERE id=? AND org_id=?`, [refId, o]))?.title;
      } catch { /* optional */ }
      titleCache.set(key, t || null);
      return t;
    };

    const byDay = {};
    for (const r of rows) {
      const line = { time: r.at_time, label: LABEL[r.kind] || r.kind, title: await resolveTitle(r.kind, r.ref_id) };
      (byDay[r.day] = byDay[r.day] || []).push(line);
    }
    const days = Object.entries(byDay).map(([day, entries]) => ({ day, entries }));
    return success(res, {
      primary_metric: rows.length ? `${rows.length} learning action${rows.length === 1 ? '' : 's'} recorded` : 'No history yet',
      data: { days },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * Study Planner (SUG-0060 §20) — the student's OWN plan only. Saves are
 * immediate per action (autosave by design), so nothing is ever lost.
 */
const plannerGuard = async (req, res) => {
  const s = await ownStudent(req);
  if (!s) { error(res, 'Student profile not found', 404); return null; }
  return s;
};

// GET /api/v1/widgets/student/planner?from&to — tasks + completed%/missed stats
router.get('/student/planner', async (req, res) => {
  try {
    const s = await plannerGuard(req, res); if (!s) return;
    const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from || '') ? req.query.from : istToday();
    const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to || '') ? req.query.to : istToday(-6); // default: next 7 days
    let tasks = [];
    try {
      tasks = await query(
        `SELECT id, DATE_FORMAT(task_date,'%Y-%m-%d') AS task_date, title, subject, is_done
           FROM client_student_planner_tasks
          WHERE org_id=? AND student_id=? AND task_date BETWEEN ? AND ?
          ORDER BY task_date, id`, [req.user.org_id, s.id, from, to]);
    } catch { /* pre-migration */ }
    let weekDone = 0, weekTotal = 0, missed = 0;
    try {
      const st = await queryOne(
        `SELECT SUM(is_done=1) done, COUNT(*) total,
                SUM(is_done=0 AND task_date < ?) missed
           FROM client_student_planner_tasks
          WHERE org_id=? AND student_id=? AND task_date >= DATE_SUB(?, INTERVAL 7 DAY)`,
        [istToday(), req.user.org_id, s.id, istToday()]);
      weekDone = Number(st?.done) || 0; weekTotal = Number(st?.total) || 0; missed = Number(st?.missed) || 0;
    } catch { /* pre-migration */ }
    return success(res, {
      primary_metric: weekTotal ? `${Math.round((weekDone / weekTotal) * 100)}% completed this week` : 'Plan your first task',
      action: missed ? { count: missed, label: `${missed} missed task${missed === 1 ? '' : 's'}` } : null,
      data: { tasks, week: { done: weekDone, total: weekTotal, missed } },
    });
  } catch (e) { return error(res, e.message, 500); }
});

// POST /api/v1/widgets/student/planner {title, task_date, subject?}
router.post('/student/planner', async (req, res) => {
  try {
    const s = await plannerGuard(req, res); if (!s) return;
    const title = String(req.body?.title || '').trim().slice(0, 200);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.body?.task_date || '') ? req.body.task_date : istToday();
    if (!title) return error(res, 'Task title required', 400);
    const r = await query(
      `INSERT INTO client_student_planner_tasks (org_id, student_id, task_date, title, subject) VALUES (?,?,?,?,?)`,
      [req.user.org_id, s.id, date, title, (req.body?.subject || '').slice(0, 60) || null]);
    return success(res, { id: r.insertId }, 'Task added', 201);
  } catch (e) {
    if (/doesn't exist/i.test(e.message)) return error(res, 'Planner needs a DB update — run scripts/planner_migration.js', 500);
    return error(res, e.message, 500);
  }
});

// PATCH /api/v1/widgets/student/planner/:id — toggle done
router.patch('/student/planner/:id', async (req, res) => {
  try {
    const s = await plannerGuard(req, res); if (!s) return;
    const r = await query(
      `UPDATE client_student_planner_tasks SET is_done = 1 - is_done WHERE id=? AND student_id=?`,
      [req.params.id, s.id]);
    if (!r.affectedRows) return error(res, 'Task not found', 404);
    return success(res, {});
  } catch (e) { return error(res, e.message, 500); }
});

// DELETE /api/v1/widgets/student/planner/:id
router.delete('/student/planner/:id', async (req, res) => {
  try {
    const s = await plannerGuard(req, res); if (!s) return;
    await query(`DELETE FROM client_student_planner_tasks WHERE id=? AND student_id=?`, [req.params.id, s.id]);
    return success(res, {});
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * Study Clock (SUG-0060 §26): a 1-minute heartbeat while the tab is visible.
 * Server-capped at 12h/day so a stuck client can't inflate the count.
 */
router.post('/student/study-heartbeat', async (req, res) => {
  try {
    const s = await ownStudent(req);
    if (!s) return error(res, 'Student profile not found', 404);
    await query(
      `INSERT INTO client_student_study_time (org_id, student_id, study_date, minutes)
       VALUES (?,?,?,1)
       ON DUPLICATE KEY UPDATE minutes = LEAST(minutes + 1, 720)`,
      [req.user.org_id, s.id, istToday()]);
    return success(res, {});
  } catch (e) {
    if (/doesn't exist/i.test(e.message)) return success(res, {}); // pre-migration: no-op
    return error(res, e.message, 500);
  }
});

/*
 * GET /api/v1/widgets/search — Global Search (Admin spec A12).
 * One query, grouped hits across the school's entities. Elevated roles only
 * (students/parents keep the nav-only command palette). Each group degrades
 * independently — a missing table just drops its group.
 */
router.get('/search', async (req, res) => {
  try {
    if (!isElevated(req)) return error(res, 'Forbidden', 403);
    const o = req.user.org_id;
    const raw = String(req.query.q || '').trim().slice(0, 60);
    if (raw.length < 2) return success(res, { groups: [] });
    const like = `%${raw}%`;

    const [students, teachers, parents, classes, exams, books] = await Promise.all([
      query(
        `SELECT s.id, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS label, s.admission_number AS sub
           FROM client_students s
           LEFT JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id
          WHERE s.org_id=? AND (CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) LIKE ? OR s.admission_number LIKE ?)
          LIMIT 5`, [o, like, like]).catch(() => []),
      query(
        `SELECT u.id, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS label, COALESCE(u.designation, u.email) AS sub
           FROM client_users u
          WHERE u.org_id=? AND u.is_active=1
            AND EXISTS (SELECT 1 FROM client_user_roles ur JOIN client_roles r ON r.id=ur.role_id
                         WHERE ur.user_id=u.id AND r.base_role='teacher')
            AND (CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) LIKE ? OR u.email LIKE ? OR u.employee_code LIKE ?)
          LIMIT 5`, [o, like, like, like]).catch(() => []),
      query(
        `SELECT p.id, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS label, u.phone AS sub
           FROM client_parents p JOIN client_users u ON u.id=p.user_id
          WHERE p.org_id=? AND (CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) LIKE ? OR u.phone LIKE ?)
          LIMIT 5`, [o, like, like]).catch(() => []),
      query(`SELECT c.id, c.name AS label, NULL AS sub FROM client_classes c WHERE c.org_id=? AND c.name LIKE ? LIMIT 5`,
        [o, like]).catch(() => []),
      query(`SELECT e.id, e.name AS label, e.exam_type AS sub FROM client_exams e WHERE e.org_id=? AND e.name LIKE ? LIMIT 5`,
        [o, like]).catch(() => []),
      query(`SELECT b.id, b.title AS label, b.author AS sub FROM client_library_books b WHERE b.org_id=? AND (b.title LIKE ? OR b.author LIKE ?) LIMIT 5`,
        [o, like, like]).catch(() => []),
    ]);

    const groups = [
      { key: 'students', label: 'Students', items: students.map(r => ({ ...r, href: `/admin/students?openStudent=${r.id}` })) },
      { key: 'teachers', label: 'Teachers', items: teachers.map(r => ({ ...r, href: `/admin/teachers?openTeacher=${r.id}` })) },
      { key: 'parents',  label: 'Parents',  items: parents.map(r => ({ ...r, href: `/admin/parents?openParent=${r.id}` })) },
      { key: 'classes',  label: 'Classes',  items: classes.map(r => ({ ...r, href: '/admin/classes' })) },
      { key: 'exams',    label: 'Exams',    items: exams.map(r => ({ ...r, href: '/admin/assessments' })) },
      { key: 'library',  label: 'Library',  items: books.map(r => ({ ...r, href: '/admin/library' })) },
    ].filter(g => g.items.length);
    return success(res, { groups });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * GET /api/v1/widgets/student/mastery — Chapter & Topic Mastery (Student §16).
 * Accuracy per chapter and per topic from the student's OWN quiz answers,
 * joined to the question bank taxonomy. Own-data only (student resolved from
 * the JWT — client ids are never trusted).
 */
router.get('/student/mastery', async (req, res) => {
  try {
    const o = req.user.org_id;
    const st = await queryOne('SELECT id FROM client_students WHERE org_id=? AND user_id=?', [o, req.user.user_id]);
    if (!st) return success(res, { data: { chapters: [], topics: [] } });

    const base = `
      FROM client_quiz_attempts att
      JOIN client_quiz_answers ans ON ans.attempt_id=att.id
      JOIN client_quiz_questions qq ON qq.id=ans.question_id
      JOIN client_qb_questions qb ON qb.id=qq.question_bank_id AND qb.org_id=att.org_id
      WHERE att.student_id=? AND att.org_id=? AND att.status IN ('submitted','graded')
        AND ans.is_correct IS NOT NULL`;

    const [chapters, topics] = await Promise.all([
      query(
        `SELECT qb.subject_id, s.name AS subject_name, qb.chapter_id, c.name AS chapter_name,
                COUNT(*) AS attempts, ROUND(SUM(ans.is_correct=1)/COUNT(*)*100,1) AS pct
           ${base.replace('WHERE', `LEFT JOIN client_qb_chapters c ON c.id=qb.chapter_id
      LEFT JOIN client_qb_subjects s ON s.id=qb.subject_id
      WHERE`)} AND qb.chapter_id IS NOT NULL
          GROUP BY qb.subject_id, s.name, qb.chapter_id, c.name
          HAVING attempts >= 3
          ORDER BY s.name, pct ASC`,
        [st.id, o]).catch(() => []),
      query(
        `SELECT qb.chapter_id, qb.topic_id, t.name AS topic_name,
                COUNT(*) AS attempts, ROUND(SUM(ans.is_correct=1)/COUNT(*)*100,1) AS pct
           ${base.replace('WHERE', `LEFT JOIN client_qb_topics t ON t.id=qb.topic_id
      WHERE`)} AND qb.topic_id IS NOT NULL
          GROUP BY qb.chapter_id, qb.topic_id, t.name
          HAVING attempts >= 2
          ORDER BY pct ASC`,
        [st.id, o]).catch(() => []),
    ]);
    return success(res, {
      primary_metric: chapters.length ? `${chapters.length} chapters tracked` : 'Attempt quizzes to build your mastery map',
      data: { chapters, topics },
    });
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;

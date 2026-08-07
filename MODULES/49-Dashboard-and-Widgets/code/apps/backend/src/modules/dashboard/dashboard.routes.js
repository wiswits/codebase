const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
// "Today" is the school's IST day, never the server's UTC day — one definition
// for the whole platform (utils/schoolDay.js). This endpoint used
// new Date().toISOString(), which on the UTC production box is the PREVIOUS day
// after 18:30 UTC; that is what let "present today" report a day the teacher
// had not marked yet (QA rounds 7-8).
const { istToday } = require('../../utils/schoolDay');
// ONE rule for count → percentage: null over an empty denominator (utils/pct.js).
const { safePctSql } = require('../../utils/pct');
// ONE definition of announcement visibility/targeting — utils/announcementTargeting.js.
// The stat tile must count exactly what the Announcements inbox lists.
const { announcementFeedSql } = require('../../utils/announcementTargeting');
// multi-branch: scope the admin KPI tiles to the active branch (null → unchanged)
const { getActiveSchool } = require('../../utils/activeSchool');

router.use(authenticate);

// Map any role slug to base role
const BASE_ROLE = {
  owner: 'admin', system_admin: 'admin', super_admin: 'admin',
  admin: 'admin', sub_admin: 'admin', principal: 'admin',
  hod: 'admin', coordinator: 'admin',
  teacher: 'teacher', student: 'student', parent: 'parent',
};

router.get('/stats', async (req, res) => {
  try {
    const { org_id, user_id } = req.user;
    const roleSlug = req.user.role_slug || req.user.role || 'admin';
    const baseRole = BASE_ROLE[roleSlug] || 'admin';
    const today = istToday();
    // ONE announcement count for every role — the same visibility rule the
    // Announcements inbox uses, so the tile and the list can never disagree.
    // It used to be `status='active'` with no targeting, spelled four times, so
    // students/parents were told about notices they could not open.
    const annVis = announcementFeedSql('a', roleSlug);
    const announcementCount = (await queryOne(
      `SELECT COUNT(*) AS cnt FROM announcements a WHERE a.org_id=? AND ${annVis.sql}`,
      [org_id, ...annVis.params]
    ).catch(() => null))?.cnt || 0;

    // ADMIN / OWNER / PRINCIPAL / SUB_ADMIN → see everything
    if (baseRole === 'admin') {
      // multi-branch: fold the active branch into each tile via the row's branch
      // path (students/classes/sections have school_id; fees→student; attendance
      // →section). teachers(client_staff) + quizzes stay org-wide for now.
      const activeSchool = await getActiveSchool(req);
      const stuIn = activeSchool ? ' AND s.school_id=?' : '';
      const colIn = activeSchool ? ' AND school_id=?' : '';
      const feeIn = activeSchool ? ' AND student_id IN (SELECT id FROM client_students WHERE org_id=? AND school_id=?)' : '';
      const attIn = activeSchool ? ' AND s.section_id IN (SELECT id FROM client_sections WHERE org_id=? AND school_id=?)' : '';
      const s1 = () => activeSchool ? [activeSchool] : [];
      const s2 = () => activeSchool ? [org_id, activeSchool] : [];
      const stats = await queryOne(`
        SELECT
          -- "current student" = client_users.is_active = 1 (archiving sets it to 0).
          -- Canonical definition lives in modules/erp/students.controller.js → stats().
          (SELECT COUNT(*) FROM client_students s JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id
             WHERE s.org_id=? AND u.is_active=1${stuIn}) students,
          -- WW-100: this counted client_staff, a legacy table no other screen
          -- reads (6 rows for DEMO SCHOOL), while the Staff page counted role
          -- rows and the greeting counted something else again — so one principal
          -- dashboard said "5 staff" in its greeting and "7" on a tile one inch
          -- below it. Same definition as modules/staff/staff.routes.js → /stats:
          -- someone holding a teaching role, not archived.
          (SELECT COUNT(DISTINCT u.id) FROM client_users u
             JOIN client_user_roles ur ON ur.user_id=u.id AND ur.org_id=u.org_id
             JOIN client_roles r ON r.id=ur.role_id
            WHERE u.org_id=? AND r.base_role='teacher' AND u.is_active=1) teachers,
          (SELECT COUNT(*) FROM client_classes WHERE org_id=?${colIn}) classes,
          (SELECT COUNT(*) FROM client_sections WHERE org_id=?${colIn}) sections,
          (SELECT COALESCE(SUM(final_amount),0) FROM client_fee_assignments WHERE org_id=?${feeIn}) total_fees,
          (SELECT COALESCE(SUM(amount),0) FROM client_fee_payments WHERE org_id=? AND status='completed'${feeIn}) collected_fees,
          (SELECT COUNT(*) FROM client_quizzes WHERE org_id=?) active_quizzes,
          (SELECT COUNT(*) FROM client_attendance_records ar
             JOIN client_attendance_sessions s ON s.id=ar.session_id
             WHERE ar.org_id=? AND s.date=? AND ar.status='present'${attIn}) present_today,
          (SELECT COUNT(*) FROM client_attendance_records ar
             JOIN client_attendance_sessions s ON s.id=ar.session_id
             WHERE ar.org_id=? AND s.date=?${attIn}) total_marked_today
      `, [org_id, ...s1(), org_id, org_id, ...s1(), org_id, ...s1(),
          org_id, ...s2(), org_id, ...s2(), org_id,
          org_id, today, ...s2(), org_id, today, ...s2()]);
      return success(res, { stats: { ...(stats || {}), announcements: announcementCount }, role: roleSlug, base_role: baseRole });
    }

    // TEACHER
    if (baseRole === 'teacher') {
      const stats = await queryOne(`
        SELECT
          (SELECT COUNT(*) FROM client_quizzes WHERE org_id=? AND created_by=?) my_quizzes,
          (SELECT COUNT(*) FROM client_students s JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id
             WHERE s.org_id=? AND u.is_active=1) total_students,
          (SELECT COUNT(*) FROM client_attendance_sessions WHERE org_id=? AND marked_by=? AND date=?) marked_today,
          (SELECT COUNT(*) FROM client_classes WHERE org_id=?) total_classes
      `, [org_id, user_id, org_id, org_id, user_id, today, org_id]);
      return success(res, { stats: { ...(stats || {}), announcements: announcementCount }, role: roleSlug, base_role: baseRole });
    }

    // STUDENT
    if (baseRole === 'student') {
      const cs = await queryOne('SELECT id FROM client_students WHERE user_id=? AND org_id=? LIMIT 1', [user_id, org_id]);
      const sid = cs?.id;
      if (!sid) return success(res, { stats: { announcements: announcementCount }, role: roleSlug });
      const stats = await queryOne(`
        SELECT
          (SELECT COUNT(*) FROM client_quiz_attempts WHERE student_id=? AND org_id=?) quizzes_attempted,
          (SELECT ROUND(AVG(percentage),1) FROM client_quiz_attempts WHERE student_id=?) avg_quiz_score,
          (SELECT ${safePctSql("SUM(ar.status='present')", 'COUNT(*)')}
             FROM client_attendance_records ar 
             JOIN client_attendance_sessions s ON s.id=ar.session_id 
             WHERE ar.student_id=? AND ar.org_id=?) attendance_pct,
          (SELECT COUNT(*) FROM client_quizzes WHERE org_id=?) active_quizzes,
          (SELECT COALESCE(SUM(fa.final_amount),0) - COALESCE((SELECT SUM(amount) FROM client_fee_payments WHERE student_id=? AND status='completed'),0)
             FROM client_fee_assignments fa WHERE fa.student_id=? AND fa.org_id=?) pending_fees
      `, [sid, org_id, sid, sid, org_id, org_id, sid, sid, org_id]);
      return success(res, { stats: { ...(stats || {}), announcements: announcementCount }, role: roleSlug, base_role: baseRole });
    }

    // PARENT — announcements is the only org-level stat here; it comes from the
    // shared count above.
    if (baseRole === 'parent') {
      return success(res, { stats: { announcements: announcementCount }, role: roleSlug, base_role: baseRole });
    }

    return success(res, { stats: { announcements: announcementCount }, role: roleSlug, base_role: baseRole });
  } catch (err) {
    console.error('dashboard/stats error:', err);
    return error(res, 'Failed to fetch stats', 500);
  }
});

module.exports = router;

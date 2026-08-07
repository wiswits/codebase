const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { getActiveSchool } = require('../../utils/activeSchool');
// ONE definition of "a child who is on the register" — see utils/headcount.js.
const { activeEnrolment } = require('../../utils/headcount');
const logger = require('../../utils/logger');

router.use(authenticate);

// Analytics exposes org financials (fees collected, defaulters) + class
// performance — staff only. A student/parent must never read this.
const requireStaff = requireRole('owner','admin','principal','coordinator','accountant','hod','super_admin','system_admin');

router.get('/dashboard', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    // multi-branch: when a branch is active, scope every aggregate to it via the
    // branch-tagged rows (student/section/class school_id). Null → org-wide.
    const S = await getActiveSchool(req);
    const [students, attendance, fees, quizzes, attTrend, feeTrend, gradeDist, classPerf] = await Promise.all([
      // Students — `total` is the CANONICAL current-student count
      // (client_users.is_active = 1; definition in
      // modules/erp/students.controller.js → stats()), so this page agrees with
      // the dashboards and the Students module. It used to be a raw COUNT(s.id)
      // including archived students, which is how one school could read 25 here
      // and 24 on the dashboard. `archived` is reported separately, and
      // new_last_30d is a TIME WINDOW (last 30 days), not a calendar month —
      // named for what it actually measures.
      queryOne(`SELECT
        SUM(CASE WHEN u.is_active=1 THEN 1 ELSE 0 END) as total,
        SUM(CASE WHEN u.is_active=1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN COALESCE(u.is_active,0)=0 THEN 1 ELSE 0 END) as archived,
        SUM(CASE WHEN u.is_active=1 AND s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_last_30d
        FROM client_students s
        LEFT JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id
        WHERE s.org_id=?${S?' AND s.school_id=?':''}`, S?[o,S]:[o]).catch(()=>({total:0,active:0,archived:0,new_last_30d:0})),

      queryOne(`SELECT COUNT(DISTINCT ar.id) as total_records,
        SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN ar.status='absent' THEN 1 ELSE 0 END) as absent_count,
        ROUND(AVG(CASE WHEN ar.status='present' THEN 100 ELSE 0 END), 1) as attendance_pct
        FROM client_attendance_records ar
        JOIN client_attendance_sessions s ON s.id=ar.session_id${S?' JOIN client_sections sec ON sec.id=s.section_id':''}
        WHERE s.org_id=? AND s.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)${S?' AND sec.school_id=?':''}`, S?[o,S]:[o]).catch(()=>({total_records:0,present_count:0,absent_count:0,attendance_pct:0})),

      // ── Two fixes in this one block, both of which made Analytics contradict
      // the Fees module on the same school, on the same day ───────────────────
      //
      // 1. `defaulters_count` read `fa.status IN ('pending','overdue')`, and
      //    NOTHING in the codebase had ever run `UPDATE client_fee_assignments
      //    SET status=…`. Every row was written 'pending' at assignment and
      //    stayed 'pending' forever, so this counted EVERY student who had ever
      //    been assigned a fee — including those paid in full — while
      //    /fees/defaulters computed the real figure from payment sums.
      //    Analytics said 300, Fees said 12, and both looked authoritative.
      //    The column is maintained now (services/feeLedger.js), but this is
      //    derived from the money regardless: a count that depends on a
      //    denormalised column being fresh is a count that will drift again.
      //
      // 2. The three collected totals counted refunded and cancelled payments
      //    as money in hand. Same `status='completed'` rule as everywhere else.
      queryOne(`SELECT
        (SELECT COALESCE(SUM(fp.amount),0) FROM client_fee_payments fp${S?' JOIN client_students st ON st.id=fp.student_id':''} WHERE fp.org_id=? AND fp.status='completed' AND DATE(fp.payment_date)=CURDATE()${S?' AND st.school_id=?':''}) as today,
        (SELECT COALESCE(SUM(fp.amount),0) FROM client_fee_payments fp${S?' JOIN client_students st ON st.id=fp.student_id':''} WHERE fp.org_id=? AND fp.status='completed' AND MONTH(fp.payment_date)=MONTH(NOW()) AND YEAR(fp.payment_date)=YEAR(NOW())${S?' AND st.school_id=?':''}) as this_month,
        (SELECT COALESCE(SUM(fp.amount),0) FROM client_fee_payments fp${S?' JOIN client_students st ON st.id=fp.student_id':''} WHERE fp.org_id=? AND fp.status='completed'${S?' AND st.school_id=?':''}) as total_collected,
        (SELECT COUNT(*) FROM (
           SELECT fa.student_id
             FROM client_fee_assignments fa${S?' JOIN client_students st ON st.id=fa.student_id':''}
            WHERE fa.org_id=?${S?' AND st.school_id=?':''}
            GROUP BY fa.student_id
           HAVING SUM(fa.final_amount) > COALESCE(SUM(
             (SELECT COALESCE(SUM(p.amount),0) FROM client_fee_payments p
               WHERE p.fee_assignment_id=fa.id AND p.status='completed')),0)
         ) d) as defaulters_count`,
        S?[o,S,o,S,o,S,o,S]:[o,o,o,o]).catch(()=>({today:0,this_month:0,total_collected:0,defaulters_count:0})),

      queryOne(`SELECT
        (SELECT COUNT(*) FROM client_quizzes WHERE org_id=?) as total_quizzes,
        (SELECT COUNT(*) FROM client_quiz_attempts qa JOIN client_quizzes q ON q.id=qa.quiz_id WHERE q.org_id=?) as total_attempts,
        -- AVG(percentage), not AVG(score). The score column is MARKS (e.g. 8/16)
        -- (no backticks in here: this is inside a JS template literal, and one
        -- stray backtick ends the string mid-SQL) and this
        -- number is rendered as "Avg Quiz Score 5.3%" — so Analytics was printing
        -- an average mark with a per-cent sign, while Reports, the admin/student
        -- dashboards and the parent portal all read AVG(percentage) and said
        -- 33.3% for the very same three attempts (WW-99).
        -- The identical mistake was already fixed twelve lines below, for the
        -- grade histogram (SUG-0059 §2) — same file, same column, same reason.
        -- One number, one definition: percentage.
        (SELECT COALESCE(ROUND(AVG(percentage), 1), 0) FROM client_quiz_attempts qa JOIN client_quizzes q ON q.id=qa.quiz_id WHERE q.org_id=? AND qa.status IN ('submitted','graded')) as avg_score`, [o,o,o]).catch(()=>({total_quizzes:0,total_attempts:0,avg_score:0})),

      query(`SELECT DATE_FORMAT(s.date, '%b %Y') as month_label,
        ROUND(AVG(CASE WHEN ar.status='present' THEN 100 ELSE 0 END), 1) as attendance_pct
        FROM client_attendance_records ar
        JOIN client_attendance_sessions s ON s.id=ar.session_id${S?' JOIN client_sections sec ON sec.id=s.section_id':''}
        WHERE s.org_id=? AND s.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)${S?' AND sec.school_id=?':''}
        GROUP BY DATE_FORMAT(s.date, '%Y-%m'), month_label
        ORDER BY DATE_FORMAT(s.date, '%Y-%m')`, S?[o,S]:[o]).catch(()=>[]),

      query(`SELECT DATE_FORMAT(fp.payment_date, '%b %Y') as month_label,
        COALESCE(SUM(fp.amount), 0) as collected
        FROM client_fee_payments fp${S?' JOIN client_students st ON st.id=fp.student_id':''} WHERE fp.org_id=? AND fp.payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)${S?' AND st.school_id=?':''}
        GROUP BY DATE_FORMAT(fp.payment_date, '%Y-%m'), month_label
        ORDER BY DATE_FORMAT(fp.payment_date, '%Y-%m')`, S?[o,S]:[o]).catch(()=>[]),

      // Grade on PERCENTAGE, not raw score — score is marks (e.g. 8/16), so the
      // old CASE dumped every attempt into 'D' (SUG-0059 §2 bug). Full A–E scale.
      query(`SELECT
        CASE WHEN qa.percentage >= 80 THEN 'A' WHEN qa.percentage >= 65 THEN 'B'
          WHEN qa.percentage >= 50 THEN 'C' WHEN qa.percentage >= 35 THEN 'D' ELSE 'E' END as grade,
        COUNT(*) as count
        FROM client_quiz_attempts qa
        JOIN client_quizzes q ON q.id=qa.quiz_id
        WHERE q.org_id=? AND qa.status IN ('submitted','graded') AND qa.percentage IS NOT NULL
        GROUP BY grade`, [o]).catch(()=>[]),

      query(`SELECT c.name as class_name,
        COUNT(DISTINCT e.student_id) as student_count,
        -- percentage, for the same reason as the org-wide figure above (WW-99):
        -- this is drawn on a chart whose axis is a per-cent.
        COALESCE(ROUND(AVG(qa.percentage), 1), 0) as avg_score
        FROM client_classes c
        LEFT JOIN client_sections sec ON sec.class_id=c.id
        -- and the same archive check every other headcount composes (WW-122),
        -- so this chart's class sizes match the Classes page and the register.
        LEFT JOIN client_enrollments e ON e.section_id=sec.id AND ${activeEnrolment('e')}
        LEFT JOIN client_quiz_attempts qa ON qa.student_id=e.student_id AND qa.status IN ('submitted','graded')
        WHERE c.org_id=?${S?' AND c.school_id=?':''}
        GROUP BY c.id, c.name
        ORDER BY c.id LIMIT 10`, S?[o,S]:[o]).catch(()=>[])
    ]);

    // Always emit the FULL A–E scale in fixed order, zero-filled — the chart
    // must show every band even when a band has no attempts.
    const gmap = Object.fromEntries((gradeDist || []).map(g => [g.grade, Number(g.count)]));
    const grades = ['A', 'B', 'C', 'D', 'E'].map(g => ({ grade: g, count: gmap[g] || 0 }));

    return success(res, {
      students: students || {total:0,active:0,new_this_month:0},
      attendance: attendance || {total_records:0,present_count:0,absent_count:0,attendance_pct:0},
      fees: fees || {today:0,this_month:0,total_collected:0,defaulters_count:0},
      quizzes: quizzes || {total_quizzes:0,total_attempts:0,avg_score:0},
      trends: { attendance: attTrend || [], fees: feeTrend || [] },
      distributions: { grades, classes: classPerf || [] }
    });
  } catch (e) { 
    logger.error('Analytics dashboard:', e); 
    return error(res, e.message, 500); 
  }
});

module.exports = router;

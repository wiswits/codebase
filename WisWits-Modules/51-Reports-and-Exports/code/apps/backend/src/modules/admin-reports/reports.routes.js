const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { success, error } = require('../../utils/response');
const { safePct } = require('../../utils/pct');
// multi-branch: scope every report to the active branch. Assignments/quizzes are
// branch-aware via their section; submissions/attempts via their student. Null →
// unchanged (single-branch orgs). Fragments below bind [orgId, activeSchool].
const { getActiveSchool } = require('../../utils/activeSchool');

router.use(authenticate);
// Financial + academic org reports are staff-only (was authenticate-only: any
// student/parent token could read org fee totals, payments, performance data).
router.use(requireRole('owner', 'admin', 'principal', 'coordinator', 'academic_coordinator', 'hod', 'accountant', 'super_admin', 'system_admin'));

// ═══ ADMIN ANALYTICS OVERVIEW ═══

// Big-picture KPIs across entire org
router.get('/overview', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    // multi-branch: assignments/quizzes scope via section, submissions/attempts via
    // student. Org-wide quizzes (no section) count in every branch. null → unchanged.
    const activeSchool = await getActiveSchool(req);
    const secIn = activeSchool ? ' AND section_id IN (SELECT id FROM client_sections WHERE org_id=? AND school_id=?)' : '';
    const secInNull = activeSchool ? ' AND (section_id IS NULL OR section_id IN (SELECT id FROM client_sections WHERE org_id=? AND school_id=?))' : '';
    const stuIn = activeSchool ? ' AND student_id IN (SELECT id FROM client_students WHERE org_id=? AND school_id=?)' : '';
    const bp = activeSchool ? [orgId, activeSchool] : [];

    const kpis = await queryOne(`
      SELECT
        (SELECT COUNT(*) FROM client_assignments WHERE org_id=? AND created_at >= ?${secIn}) AS assignments_this_month,
        (SELECT COUNT(*) FROM client_assignment_submissions WHERE org_id=? AND submitted_at >= ?${stuIn}) AS submissions_this_month,
        (SELECT COUNT(*) FROM client_assignment_submissions WHERE org_id=? AND status='submitted'${stuIn}) AS pending_grading,
        (SELECT COUNT(*) FROM client_assignment_submissions WHERE org_id=? AND is_late=1${stuIn}) AS late_submissions,
        (SELECT COUNT(*) FROM client_quizzes WHERE org_id=? AND status='published'${secInNull}) AS active_quizzes,
        (SELECT COUNT(*) FROM client_quiz_attempts WHERE org_id=? AND status IN ('submitted','graded')${stuIn}) AS total_quiz_attempts,
        (SELECT ROUND(AVG(percentage),1) FROM client_quiz_attempts WHERE org_id=? AND status IN ('submitted','graded')${stuIn}) AS avg_quiz_score,
        (SELECT COUNT(*) FROM client_worksheets WHERE org_id=?) AS total_worksheets
    `, [orgId, monthStart, ...bp, orgId, monthStart, ...bp, orgId, ...bp, orgId, ...bp, orgId, ...bp, orgId, ...bp, orgId, ...bp, orgId]);

    // Submission rate calc
    const submissionStats = await queryOne(`
      SELECT
        COUNT(DISTINCT sub.id) total_submissions,
        SUM(CASE WHEN sub.status='graded' THEN 1 ELSE 0 END) graded_count,
        -- expected submissions = one per CURRENT actively-enrolled student per
        -- published assignment in that student's own section. The old form
        -- multiplied two unrelated COUNT(DISTINCT)s across the whole org and
        -- counted archived/dropped students, inflating the denominator.
        (SELECT COUNT(*)
         FROM client_assignments a
         JOIN client_enrollments e ON e.section_id=a.section_id AND e.org_id=a.org_id AND e.status='active'
         JOIN client_students st ON st.id=e.student_id
         JOIN client_users eu ON eu.id=st.user_id AND eu.is_active=1
         WHERE a.org_id=? AND a.status='published'${activeSchool ? ' AND st.school_id=?' : ''}) expected_submissions
      FROM client_assignment_submissions sub
      WHERE sub.org_id=?${stuIn ? ' AND sub.student_id IN (SELECT id FROM client_students WHERE org_id=? AND school_id=?)' : ''}
    `, [orgId, ...(activeSchool ? [activeSchool] : []), orgId, ...bp]);
    
    // x/0 is NOT 0% — "nothing was assigned yet" and "nobody submitted" are
    // different facts. safePct returns null and the UI renders "—" (utils/pct.js).
    const submissionRate = safePct(submissionStats.total_submissions, submissionStats.expected_submissions);

    return success(res, { kpis, submission_rate: submissionRate, grading_pct: safePct(submissionStats.graded_count, submissionStats.total_submissions) });
  } catch (err) { return error(res, err.message); }
});

// Added by audit script — alias routes for frontend compat
router.get('/financial', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { query: q, queryOne } = require('../../config/db');
    const activeSchool = await getActiveSchool(req);
    const inBranch = activeSchool ? ' AND {t}.student_id IN (SELECT id FROM client_students WHERE org_id=? AND school_id=?)' : '';
    const bp = () => activeSchool ? [orgId, activeSchool] : [];
    const totals = await queryOne(
      `SELECT
        COALESCE(SUM(fa.final_amount),0) AS total_assigned,
        COALESCE((SELECT SUM(fp.amount) FROM client_fee_payments fp WHERE fp.org_id=? AND fp.status='completed'${inBranch.replace(/{t}/g,'fp')}),0) AS total_collected
       FROM client_fee_assignments fa WHERE fa.org_id=?${inBranch.replace(/{t}/g,'fa')}`,
      [orgId, ...bp(), orgId, ...bp()]
    );
    const recent = await q(
      `SELECT fp.id, fp.amount, fp.payment_date, fp.payment_mode
       FROM client_fee_payments fp WHERE fp.org_id=? AND fp.status='completed'${inBranch.replace(/{t}/g,'fp')} ORDER BY fp.payment_date DESC LIMIT 10`,
      [orgId, ...bp()]
    );
    return res.json({ status: 'success', data: { totals, recent_payments: recent } });
  } catch (e) {
    return res.json({ status: 'success', data: { totals: { total_assigned: 0, total_collected: 0 }, recent_payments: [] } });
  }
});

router.get('/academic', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { query: q } = require('../../config/db');
    const activeSchool = await getActiveSchool(req);
    const secIn = activeSchool ? ' AND section_id IN (SELECT id FROM client_sections WHERE org_id=? AND school_id=?)' : '';
    const stuIn = activeSchool ? ' AND student_id IN (SELECT id FROM client_students WHERE org_id=? AND school_id=?)' : '';
    const bp = activeSchool ? [orgId, activeSchool] : [];
    const stats = await q(
      `SELECT
        (SELECT COUNT(*) FROM client_quiz_attempts WHERE org_id=? AND submitted_at IS NOT NULL${stuIn}) AS total_quiz_attempts,
        (SELECT ROUND(AVG(percentage),1) FROM client_quiz_attempts WHERE org_id=? AND submitted_at IS NOT NULL${stuIn}) AS avg_quiz_score,
        (SELECT COUNT(*) FROM client_assignments WHERE org_id=?${secIn}) AS total_assignments`,
      [orgId, ...bp, orgId, ...bp, orgId, ...bp]
    );
    return res.json({ status: 'success', data: stats[0] || {} });
  } catch (e) {
    return res.json({ status: 'success', data: {} });
  }
});


// Assignment-wise stats (for table)
router.get('/assignments', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { search, subject_id, section_id, status } = req.query;
    
    const where = ['a.org_id=?'];
    const params = [orgId];
    if (search) { where.push('a.title LIKE ?'); params.push(`%${search}%`); }
    if (subject_id) { where.push('a.subject_id=?'); params.push(subject_id); }
    if (section_id) { where.push('a.section_id=?'); params.push(section_id); }
    if (status) { where.push('a.status=?'); params.push(status); }
    const activeSchool = await getActiveSchool(req);
    if (activeSchool) { where.push('sec.school_id=?'); params.push(activeSchool); }

    const rows = await query(`
      SELECT a.id, a.title, a.max_marks, a.due_date, a.status, a.created_at,
             s.name AS subject_name, sec.name AS section_name, cc.name AS class_name,
             CONCAT(u.first_name,' ',u.last_name) AS teacher_name,
             -- class size = CURRENT students actively enrolled in that section
             -- (client_users.is_active = 1, the canonical definition in
             -- modules/erp/students.controller.js → stats()). It used to count
             -- every enrolment row ever written for the section — dropped and
             -- archived students included — so the "x of y submitted" denominator
             -- was larger than the school's own student count. org_id-scoped too.
             (SELECT COUNT(DISTINCT e.student_id) FROM client_enrollments e
                JOIN client_students st ON st.id=e.student_id
                JOIN client_users eu ON eu.id=st.user_id AND eu.is_active=1
               WHERE e.section_id=a.section_id AND e.org_id=a.org_id AND e.status='active') AS total_students,
             (SELECT COUNT(*) FROM client_assignment_submissions WHERE assignment_id=a.id) AS submitted_count,
             (SELECT COUNT(*) FROM client_assignment_submissions WHERE assignment_id=a.id AND status='graded') AS graded_count,
             (SELECT COUNT(*) FROM client_assignment_submissions WHERE assignment_id=a.id AND is_late=1) AS late_count,
             (SELECT ROUND(AVG(marks_obtained),2) FROM client_assignment_submissions WHERE assignment_id=a.id AND status='graded') AS avg_marks
      FROM client_assignments a
      LEFT JOIN client_subjects s ON s.id=a.subject_id
      LEFT JOIN client_sections sec ON sec.id=a.section_id
      LEFT JOIN client_classes cc ON cc.id=sec.class_id
      LEFT JOIN client_users u ON u.id=a.teacher_id
      WHERE ${where.join(' AND ')}
      ORDER BY a.created_at DESC LIMIT 200
    `, params);
    
    return success(res, { assignments: rows });
  } catch (err) { return error(res, err.message); }
});

// Quiz-wise stats
router.get('/quizzes', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const activeSchool = await getActiveSchool(req);
    // quiz is branch-aware via its section; org-wide quizzes (no section) show in all
    const branchJoin = activeSchool ? ' LEFT JOIN client_sections sec ON sec.id=q.section_id' : '';
    const branchWhere = activeSchool ? ' AND (q.section_id IS NULL OR sec.school_id=?)' : '';
    const rows = await query(`
      SELECT q.id, q.title, q.total_marks, q.duration_minutes, q.status, q.available_until,
             CONCAT(u.first_name,' ',u.last_name) AS creator_name,
             (SELECT COUNT(*) FROM client_quiz_questions WHERE quiz_id=q.id) AS question_count,
             (SELECT COUNT(*) FROM client_quiz_attempts WHERE quiz_id=q.id AND status IN ('submitted','graded')) AS attempts,
             (SELECT ROUND(AVG(percentage),1) FROM client_quiz_attempts WHERE quiz_id=q.id AND status IN ('submitted','graded')) AS avg_pct,
             (SELECT MAX(score) FROM client_quiz_attempts WHERE quiz_id=q.id AND status IN ('submitted','graded')) AS top_score,
             (SELECT COUNT(*) FROM client_quiz_attempts WHERE quiz_id=q.id AND tab_switches > 0) AS flagged_attempts
      FROM client_quizzes q
      LEFT JOIN client_users u ON u.id=q.created_by${branchJoin}
      WHERE q.org_id=?${branchWhere}
      ORDER BY q.created_at DESC LIMIT 200
    `, activeSchool ? [orgId, activeSchool] : [orgId]);
    return success(res, { quizzes: rows });
  } catch (err) { return error(res, err.message); }
});

// Top performers (students across quizzes)
router.get('/top-performers', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const activeSchool = await getActiveSchool(req);
    const rows = await query(`
      SELECT s.id, u.first_name, u.last_name, s.admission_number,
             -- MAX(), not a bare column: this is GROUP BY s.id, and a bare
             -- cc.name is rejected outright under ONLY_FULL_GROUP_BY. Prod's
             -- MariaDB allows it, the dev MySQL does not — so this query could
             -- not be run at all on a developer's machine, which is a large part
             -- of why WW-127 was found by a school instead of by us.
             MAX(cc.name) AS class_name, MAX(sec.name) AS section_name,
             COUNT(a.id) AS attempts,
             ROUND(AVG(a.percentage), 1) AS avg_pct,
             MAX(a.percentage) AS best_pct,
             SUM(a.score) AS total_score
      FROM client_students s
      JOIN client_users u ON u.id=s.user_id
      JOIN client_quiz_attempts a ON a.student_id=s.id AND a.status IN ('submitted','graded')
      LEFT JOIN client_enrollments e ON e.student_id=s.id
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes cc ON cc.id=sec.class_id
      -- Only children who are still here. Quiz attempts outlive the student row
      -- that made them, so without this the board celebrated an old cohort:
      -- "Diya Patel" and two others the school had never enrolled, and a second
      -- Aarav Mehta under a retired roll scheme sitting beside the real one
      -- (WW-127). A leaderboard naming a child who does not exist is not a
      -- cosmetic fault — a parent asks why their child is not on it.
      WHERE s.org_id=? AND u.is_active=1${activeSchool ? ' AND s.school_id=?' : ''}
      GROUP BY s.id
      ORDER BY avg_pct DESC, attempts DESC
      LIMIT 20
    `, activeSchool ? [orgId, activeSchool] : [orgId]);
    return success(res, { performers: rows });
  } catch (err) { return error(res, err.message); }
});

// Class-wise comparison (for charts)
router.get('/class-comparison', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const activeSchool = await getActiveSchool(req);
    const rows = await query(`
      SELECT cc.id, cc.name AS class_name,
             COUNT(DISTINCT a.id) AS quiz_count,
             COUNT(DISTINCT att.id) AS attempts,
             ROUND(AVG(att.percentage), 1) AS avg_pct
      FROM client_classes cc
      LEFT JOIN client_sections sec ON sec.class_id=cc.id
      LEFT JOIN client_quizzes a ON a.section_id=sec.id
      LEFT JOIN client_quiz_attempts att ON att.quiz_id=a.id AND att.status IN ('submitted','graded')
      WHERE cc.org_id=?${activeSchool ? ' AND cc.school_id=?' : ''}
      GROUP BY cc.id
      HAVING attempts > 0
      ORDER BY avg_pct DESC
      LIMIT 20
    `, activeSchool ? [orgId, activeSchool] : [orgId]);
    return success(res, { classes: rows });
  } catch (err) { return error(res, err.message); }
});

// Pending grading queue (teacher action needed)
router.get('/pending-grading', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const activeSchool = await getActiveSchool(req);
    const rows = await query(`
      SELECT sub.id, sub.submitted_at, sub.is_late,
             a.title AS assignment_title, a.max_marks, a.id AS assignment_id,
             u.first_name, u.last_name, st.admission_number,
             CONCAT(tu.first_name,' ',tu.last_name) AS teacher_name,
             cc.name AS class_name, sec.name AS section_name,
             TIMESTAMPDIFF(HOUR, sub.submitted_at, NOW()) AS hours_waiting
      FROM client_assignment_submissions sub
      JOIN client_assignments a ON a.id=sub.assignment_id
      LEFT JOIN client_students st ON st.id=sub.student_id
      LEFT JOIN client_users u ON u.id=st.user_id
      LEFT JOIN client_users tu ON tu.id=a.teacher_id
      JOIN client_sections sec ON sec.id=a.section_id
      LEFT JOIN client_classes cc ON cc.id=sec.class_id
      WHERE sub.org_id=? AND sub.status='submitted'${activeSchool ? ' AND sec.school_id=?' : ''}
      ORDER BY sub.submitted_at ASC
      LIMIT 50
    `, activeSchool ? [orgId, activeSchool] : [orgId]);
    return success(res, { pending: rows });
  } catch (err) { return error(res, err.message); }
});

// CSV export — assignments report
router.get('/export/assignments.csv', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const activeSchool = await getActiveSchool(req);
    const rows = await query(`
      SELECT a.id, a.title, s.name subject, cc.name class_name, sec.name section,
             CONCAT(u.first_name,' ',u.last_name) teacher,
             a.max_marks, a.due_date, a.status,
             -- same canonical class size as /assignments above
             (SELECT COUNT(DISTINCT e.student_id) FROM client_enrollments e
                JOIN client_students st ON st.id=e.student_id
                JOIN client_users eu ON eu.id=st.user_id AND eu.is_active=1
               WHERE e.section_id=a.section_id AND e.org_id=a.org_id AND e.status='active') total_students,
             (SELECT COUNT(*) FROM client_assignment_submissions WHERE assignment_id=a.id) submitted,
             (SELECT COUNT(*) FROM client_assignment_submissions WHERE assignment_id=a.id AND status='graded') graded,
             (SELECT ROUND(AVG(marks_obtained),2) FROM client_assignment_submissions WHERE assignment_id=a.id AND status='graded') avg_marks
      FROM client_assignments a
      LEFT JOIN client_subjects s ON s.id=a.subject_id
      JOIN client_sections sec ON sec.id=a.section_id
      LEFT JOIN client_classes cc ON cc.id=sec.class_id
      LEFT JOIN client_users u ON u.id=a.teacher_id
      WHERE a.org_id=?${activeSchool ? ' AND sec.school_id=?' : ''}
      ORDER BY a.created_at DESC
    `, activeSchool ? [orgId, activeSchool] : [orgId]);

    let csv = 'ID,Title,Subject,Class,Section,Teacher,Max Marks,Due Date,Status,Total Students,Submitted,Graded,Avg Marks\n';
    rows.forEach(r => {
      csv += `${r.id},"${(r.title||'').replace(/"/g,'""')}","${r.subject||''}","${r.class_name||''}","${r.section||''}","${r.teacher||''}",${r.max_marks||0},"${r.due_date||''}",${r.status||''},${r.total_students||0},${r.submitted||0},${r.graded||0},${r.avg_marks||''}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=assignments_report_${Date.now()}.csv`);
    res.send(csv);
  } catch (err) { error(res, 'Failed to generate report', 500, err.message); }
});

// CSV export — quiz results
router.get('/export/quizzes.csv', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const activeSchool = await getActiveSchool(req);
    const rows = await query(`
      SELECT q.title quiz_title,
             u.first_name, u.last_name, s.admission_number,
             cc.name class_name, sec.name section_name,
             a.score, a.percentage, a.correct_count, a.wrong_count, a.skipped_count,
             a.tab_switches, a.auto_submitted, a.submitted_at,
             TIMESTAMPDIFF(SECOND, a.started_at, a.submitted_at) duration_seconds
      FROM client_quiz_attempts a
      JOIN client_quizzes q ON q.id=a.quiz_id
      LEFT JOIN client_students s ON s.id=a.student_id
      LEFT JOIN client_users u ON u.id=s.user_id
      LEFT JOIN client_enrollments e ON e.student_id=s.id
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes cc ON cc.id=sec.class_id
      WHERE a.org_id=? AND a.status IN ('submitted','graded')${activeSchool ? ' AND s.school_id=?' : ''}
      ORDER BY q.title, a.score DESC
    `, activeSchool ? [orgId, activeSchool] : [orgId]);
    
    let csv = 'Quiz,Student Name,Roll No,Class,Section,Score,Percentage,Correct,Wrong,Skipped,Tab Switches,Auto Submitted,Submitted At,Duration (s)\n';
    rows.forEach(r => {
      csv += `"${r.quiz_title||''}","${r.first_name||''} ${r.last_name||''}",${r.admission_number||''},"${r.class_name||''}","${r.section_name||''}",${r.score||0},${r.percentage||0},${r.correct_count||0},${r.wrong_count||0},${r.skipped_count||0},${r.tab_switches||0},${r.auto_submitted?'Yes':'No'},"${r.submitted_at||''}",${r.duration_seconds||0}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=quiz_results_${Date.now()}.csv`);
    res.send(csv);
  } catch (err) { error(res, 'Failed to generate report', 500, err.message); }
});

module.exports = router;

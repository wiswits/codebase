const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');

async function getStudentId(userId, orgId) {
  const r = await queryOne(`SELECT id FROM client_students WHERE user_id = ? AND org_id = ? LIMIT 1`, [userId, orgId]);
  return r?.id || null;
}

// GET /api/quiz-portal/analytics/teacher/overview
const teacherOverview = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;

    // Top-line stats — across all my published tests
    const stats = await queryOne(`
      SELECT
        (SELECT COUNT(*) FROM client_quizzes WHERE org_id = ? AND created_by = ?) AS total_tests,
        (SELECT COUNT(*) FROM client_quizzes WHERE org_id = ? AND created_by = ? AND status = 'published') AS live_tests,
        (SELECT COUNT(DISTINCT a.student_id)
           FROM client_quiz_attempts a
           JOIN client_quizzes q ON q.id = a.quiz_id
           WHERE q.org_id = ? AND q.created_by = ?) AS unique_students,
        (SELECT COUNT(*)
           FROM client_quiz_attempts a
           JOIN client_quizzes q ON q.id = a.quiz_id
           WHERE q.org_id = ? AND q.created_by = ?) AS total_attempts,
        (SELECT ROUND(AVG(a.percentage), 1)
           FROM client_quiz_attempts a
           JOIN client_quizzes q ON q.id = a.quiz_id
           WHERE q.org_id = ? AND q.created_by = ? AND a.status IN ('submitted','graded')) AS avg_score,
        (SELECT COUNT(*)
           FROM client_qb_questions WHERE org_id = ? AND created_by = ?) AS my_questions
    `, [orgId, userId, orgId, userId, orgId, userId, orgId, userId, orgId, userId, orgId, userId]);

    // Recent activity — last 14 days, attempts per day
    const activity = await query(`
      SELECT DATE(a.started_at) AS day, COUNT(*) AS attempts
      FROM client_quiz_attempts a
      JOIN client_quizzes q ON q.id = a.quiz_id
      WHERE q.org_id = ? AND q.created_by = ?
        AND a.started_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
      GROUP BY DATE(a.started_at)
      ORDER BY day ASC
    `, [orgId, userId]);

    // Score distribution (buckets)
    const buckets = await query(`
      SELECT
        SUM(CASE WHEN percentage < 40 THEN 1 ELSE 0 END) AS b0,
        SUM(CASE WHEN percentage >= 40 AND percentage < 60 THEN 1 ELSE 0 END) AS b1,
        SUM(CASE WHEN percentage >= 60 AND percentage < 75 THEN 1 ELSE 0 END) AS b2,
        SUM(CASE WHEN percentage >= 75 AND percentage < 90 THEN 1 ELSE 0 END) AS b3,
        SUM(CASE WHEN percentage >= 90 THEN 1 ELSE 0 END) AS b4
      FROM client_quiz_attempts a
      JOIN client_quizzes q ON q.id = a.quiz_id
      WHERE q.org_id = ? AND q.created_by = ? AND a.status IN ('submitted','graded')
    `, [orgId, userId]);

    // Top-performing tests (most attempts)
    const topTests = await query(`
      SELECT q.id, q.title, q.subject_id, s.name AS subject_name,
             COUNT(a.id) AS attempt_count,
             ROUND(AVG(a.percentage), 1) AS avg_score
      FROM client_quizzes q
      LEFT JOIN client_quiz_attempts a ON a.quiz_id = q.id AND a.status IN ('submitted','graded')
      LEFT JOIN client_qb_subjects s ON s.id = q.subject_id
      WHERE q.org_id = ? AND q.created_by = ? AND q.status = 'published'
      GROUP BY q.id
      ORDER BY attempt_count DESC, q.created_at DESC
      LIMIT 5
    `, [orgId, userId]);

    // Weak topics — questions with high wrong rate
    const weakQuestions = await query(`
      SELECT qb.id, qb.question_text, qb.times_used, qb.times_correct, qb.times_wrong,
             qb.subject_id, s.name AS subject_name,
             qb.chapter_id, c.name AS chapter_name,
             ROUND(qb.times_wrong / NULLIF(qb.times_used, 0) * 100, 1) AS wrong_rate
      FROM client_qb_questions qb
      LEFT JOIN client_qb_subjects s ON s.id = qb.subject_id
      LEFT JOIN client_qb_chapters c ON c.id = qb.chapter_id
      WHERE qb.org_id = ? AND qb.created_by = ?
        AND qb.times_used >= 3
      ORDER BY wrong_rate DESC, qb.times_used DESC
      LIMIT 5
    `, [orgId, userId]);

    return success(res, {
      stats: stats || {},
      activity_14d: activity,
      score_distribution: buckets[0] || {},
      top_tests: topTests,
      weak_questions: weakQuestions,
    });
  } catch (e) {
    logger.error('teacherOverview:', e);
    return error(res, 'failed_to_get_teacher_analytics', 500, e.message);
  }
};

// GET /api/quiz-portal/analytics/student/overview
const studentOverview = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const studentId = await getStudentId(userId, orgId);
    if (!studentId) {
      // Not a student — return empty payload gracefully
      return success(res, { is_student: false });
    }

    const stats = await queryOne(`
      SELECT
        (SELECT COUNT(*) FROM client_quiz_attempts WHERE student_id = ? AND org_id = ?) AS total_attempts,
        (SELECT COUNT(*) FROM client_quiz_attempts WHERE student_id = ? AND org_id = ? AND status IN ('submitted','graded')) AS completed,
        (SELECT ROUND(AVG(percentage), 1) FROM client_quiz_attempts WHERE student_id = ? AND org_id = ? AND status IN ('submitted','graded')) AS avg_score,
        (SELECT MAX(percentage) FROM client_quiz_attempts WHERE student_id = ? AND org_id = ? AND status IN ('submitted','graded')) AS best_score,
        (SELECT SUM(correct_count) FROM client_quiz_attempts WHERE student_id = ? AND org_id = ? AND status IN ('submitted','graded')) AS total_correct,
        (SELECT SUM(wrong_count) FROM client_quiz_attempts WHERE student_id = ? AND org_id = ? AND status IN ('submitted','graded')) AS total_wrong
    `, [studentId, orgId, studentId, orgId, studentId, orgId, studentId, orgId, studentId, orgId, studentId, orgId]);

    // Recent attempts — last 10
    const recent = await query(`
      SELECT a.id, a.percentage, a.score, a.correct_count, a.wrong_count, a.skipped_count,
             a.submitted_at, a.status,
             q.title AS test_title, q.total_marks
      FROM client_quiz_attempts a
      JOIN client_quizzes q ON q.id = a.quiz_id
      WHERE a.student_id = ? AND a.org_id = ?
      ORDER BY a.started_at DESC
      LIMIT 10
    `, [studentId, orgId]);

    // Subject-wise accuracy
    const bySubject = await query(`
      SELECT s.id, s.name AS subject_name,
             COUNT(DISTINCT a.id) AS attempts,
             SUM(ans.is_correct) AS correct,
             COUNT(ans.id) AS total_q,
             ROUND(SUM(ans.is_correct) / NULLIF(COUNT(ans.id), 0) * 100, 1) AS accuracy
      FROM client_quiz_attempts a
      JOIN client_quizzes q ON q.id = a.quiz_id
      LEFT JOIN client_quiz_answers ans ON ans.attempt_id = a.id
      LEFT JOIN client_qb_subjects s ON s.id = q.subject_id
      WHERE a.student_id = ? AND a.org_id = ? AND a.status IN ('submitted','graded')
        AND s.id IS NOT NULL
      GROUP BY s.id
      ORDER BY accuracy DESC
    `, [studentId, orgId]);

    // Score trend (last 10 attempts in order)
    const trend = await query(`
      SELECT a.id, a.percentage, q.title, a.submitted_at
      FROM client_quiz_attempts a
      JOIN client_quizzes q ON q.id = a.quiz_id
      WHERE a.student_id = ? AND a.org_id = ? AND a.status IN ('submitted','graded')
      ORDER BY a.submitted_at ASC
      LIMIT 10
    `, [studentId, orgId]);

    return success(res, {
      is_student: true,
      stats: stats || {},
      recent_attempts: recent,
      by_subject: bySubject,
      score_trend: trend,
    });
  } catch (e) {
    logger.error('studentOverview:', e);
    return error(res, 'failed_to_get_student_analytics', 500, e.message);
  }
};

module.exports = { teacherOverview, studentOverview };

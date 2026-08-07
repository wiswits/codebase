const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');
const { readScopeFor } = require('../qbank/libraryScope');

function safeJson(s) { if (typeof s !== 'string') return s; try { return JSON.parse(s); } catch { return s; } }

// Resolves the student_id for the current user (from client_students).
// Returns null if user is not a registered student.
async function getStudentId(userId, orgId) {
  const row = await queryOne(
    `SELECT id FROM client_students WHERE user_id = ? AND org_id = ? LIMIT 1`,
    [userId, orgId]
  );
  return row?.id || null;
}


// Helper: shuffle array (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET /api/quiz-portal/attempts/test/:id  — fetch test with questions for taking (no answers!)
const getTestForAttempt = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const { id } = req.params;

    const test = await queryOne(`
      SELECT id, title, description, total_marks, passing_marks, duration_minutes,
             negative_marking, available_from, available_until, status
      FROM client_quizzes
      WHERE id = ? AND org_id = ? AND status = 'published'
    `, [id, orgId]);
    if (!test) return error(res, 'test_not_found_or_not_published', 404);

    // Time-window check
    const now = new Date();
    if (test.available_from && new Date(test.available_from) > now) {
      return error(res, 'test_not_yet_open', 403, 'Test starts at ' + test.available_from);
    }
    if (test.available_until && new Date(test.available_until) < now) {
      return error(res, 'test_window_closed', 403, 'Test closed at ' + test.available_until);
    }

    const config = await queryOne(
      `SELECT shuffle_questions, shuffle_options, show_result_immediately,
              show_solution_after, attempt_limit, calculator_enabled, lock_navigation
       FROM client_quiz_config WHERE quiz_id = ?`, [id]
    );

    // Resolve student_id (must be a registered student)
    const studentId = await getStudentId(userId, orgId);
    if (!studentId) return error(res, 'only_students_can_attempt', 403, 'Your account is not registered as a student. Login as a student to attempt tests.');

    // Check attempt limit
    if (config?.attempt_limit) {
      const prev = await queryOne(
        `SELECT COUNT(*) AS n FROM client_quiz_attempts
         WHERE quiz_id = ? AND student_id = ? AND status IN ('submitted','graded')`,
        [id, studentId]
      );
      if (prev?.n >= config.attempt_limit) {
        return error(res, 'attempt_limit_reached', 403,
          `You have used all ${config.attempt_limit} attempt(s)`);
      }
    }

    // Fetch questions WITHOUT correct_answer / solution
    let questions = await query(`
      SELECT id, question_text, question_type, options,
             marks AS marks_positive, marks_negative, has_latex, image_url, difficulty, sequence AS position
      FROM client_quiz_questions
      WHERE quiz_id = ?
      ORDER BY sequence ASC
    `, [id]);

    // Apply shuffle
    if (config?.shuffle_questions) questions = shuffle(questions);

    questions = questions.map(q => {
      const opts = q.options ? safeJson(q.options) : null;
      return {
        ...q,
        options: opts && config?.shuffle_options && Array.isArray(opts) ? shuffle(opts) : opts,
      };
    });

    // Find or create in-progress attempt
    let attempt = await queryOne(
      `SELECT id, started_at FROM client_quiz_attempts
       WHERE quiz_id = ? AND student_id = ? AND status = 'in_progress'
       ORDER BY started_at DESC LIMIT 1`,
      [id, studentId]
    );

    if (!attempt) {
      const r = await query(
        `INSERT INTO client_quiz_attempts (org_id, quiz_id, student_id, status)
         VALUES (?, ?, ?, 'in_progress')`,
        [orgId, id, studentId]
      );
      attempt = { id: r.insertId, started_at: new Date().toISOString() };
    }

    return success(res, { test, config: config || {}, questions, attempt });
  } catch (e) {
    logger.error('getTestForAttempt:', e);
    return error(res, 'failed_to_get_test', 500, e.message);
  }
};

// POST /api/quiz-portal/attempts/:attemptId/answer
// Save a single answer (autosave on each question)
const saveAnswer = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const { attemptId } = req.params;
    const { question_id, answer, time_spent_seconds = 0 } = req.body;

    if (!question_id) return error(res, 'question_id_required', 400);

    // Verify attempt belongs to user + is in progress
    const attempt = await queryOne(
      `SELECT id, status, quiz_id FROM client_quiz_attempts WHERE id = ? AND student_id = ? AND org_id = ?`,
      [attemptId, await getStudentId(userId, orgId), orgId]
    );
    if (!attempt) return error(res, 'attempt_not_found', 404);
    if (attempt.status !== 'in_progress') return error(res, 'attempt_not_in_progress', 400);

    // Upsert answer (delete previous if exists, then insert)
    await query(
      `DELETE FROM client_quiz_answers WHERE attempt_id = ? AND question_id = ?`,
      [attemptId, question_id]
    );
    await query(
      `INSERT INTO client_quiz_answers (org_id, attempt_id, question_id, student_answer, time_spent_seconds)
       VALUES (?, ?, ?, ?, ?)`,
      [orgId, attemptId, question_id, answer || null, time_spent_seconds || 0]
    );

    return success(res, { saved: true });
  } catch (e) {
    logger.error('saveAnswer:', e);
    return error(res, 'failed_to_save_answer', 500, e.message);
  }
};

// POST /api/quiz-portal/attempts/:attemptId/flag
const toggleFlag = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.org_id;
    const { attemptId } = req.params;
    const { question_id } = req.body;

    const attempt = await queryOne(
      `SELECT id, flagged_questions FROM client_quiz_attempts WHERE id = ? AND student_id = ? AND org_id = ?`,
      [attemptId, await getStudentId(userId, orgId), orgId]
    );
    if (!attempt) return error(res, 'attempt_not_found', 404);

    let flagged = [];
    try { flagged = JSON.parse(attempt.flagged_questions || '[]'); } catch {}
    const idx = flagged.indexOf(Number(question_id));
    if (idx >= 0) flagged.splice(idx, 1);
    else flagged.push(Number(question_id));

    await query(
      `UPDATE client_quiz_attempts SET flagged_questions = ? WHERE id = ?`,
      [JSON.stringify(flagged), attemptId]
    );
    return success(res, { flagged });
  } catch (e) {
    logger.error('toggleFlag:', e);
    return error(res, 'failed_to_flag', 500, e.message);
  }
};

// POST /api/quiz-portal/attempts/:attemptId/submit
const submitAttempt = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const { attemptId } = req.params;
    const { auto_submitted = false } = req.body;

    const attempt = await queryOne(
      `SELECT * FROM client_quiz_attempts WHERE id = ? AND student_id = ? AND org_id = ?`,
      [attemptId, await getStudentId(userId, orgId), orgId]
    );
    if (!attempt) return error(res, 'attempt_not_found', 404);
    if (attempt.status !== 'in_progress') return error(res, 'already_submitted', 400);

    // Get all quiz questions with correct answers
    const questions = await query(
      `SELECT id, question_type, correct_answer, marks AS marks_positive, marks_negative, marks_partial
       FROM client_quiz_questions WHERE quiz_id = ?`,
      [attempt.quiz_id]
    );
    const qMap = {};
    questions.forEach(q => qMap[q.id] = q);

    // Get student answers
    const answers = await query(
      `SELECT id, question_id, student_answer FROM client_quiz_answers WHERE attempt_id = ?`,
      [attemptId]
    );

    let score = 0, correct_count = 0, wrong_count = 0, skipped_count = 0;
    const totalMarks = questions.reduce((s, q) => s + Number(q.marks_positive || 4), 0);

    for (const q of questions) {
      const ans = answers.find(a => a.question_id === q.id);
      if (!ans || !ans.student_answer || String(ans.student_answer).trim() === '') {
        skipped_count++;
        continue;
      }

      // Compare answer
      let isCorrect = false;
      const studAns = String(ans.student_answer).trim().toUpperCase().replace(/\s/g, '');
      const correct = String(q.correct_answer || '').trim().toUpperCase().replace(/\s/g, '');

      if (q.question_type === 'mcq_multi') {
        // Sort both, compare as sets
        const sa = studAns.split(',').sort().join(',');
        const ca = correct.split(',').sort().join(',');
        isCorrect = sa === ca;
      } else if (q.question_type === 'integer') {
        isCorrect = studAns === correct;
      } else {
        isCorrect = studAns === correct;
      }

      const marksObtained = isCorrect ? Number(q.marks_positive || 4) : -Number(q.marks_negative || 0);
      score += marksObtained;
      if (isCorrect) correct_count++;
      else wrong_count++;

      await query(
        `UPDATE client_quiz_answers SET is_correct = ?, marks_obtained = ? WHERE id = ?`,
        [isCorrect ? 1 : 0, marksObtained, ans.id]
      );
    }

    // Floor score at 0 if all wrong
    if (score < 0) score = 0;
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;

    await query(
      `UPDATE client_quiz_attempts
       SET status = 'submitted', submitted_at = NOW(),
           score = ?, percentage = ?,
           correct_count = ?, wrong_count = ?, skipped_count = ?,
           auto_submitted = ?
       WHERE id = ?`,
      [score, percentage, correct_count, wrong_count, skipped_count, auto_submitted ? 1 : 0, attemptId]
    );

    // Bump qb_question stats.
    //
    // These ran on a bare id, so a student submitting an attempt at one school
    // edited a question row at another. The id comes from client_quiz_questions,
    // which is the school's own snapshot of the question — but question_bank_id
    // is whatever was stored there, and an unscoped UPDATE trusts it completely.
    //
    // Scoped to the caller's org OR the platform library: a school using a
    // library question should contribute to that question's statistics, and to
    // nothing else. orgId was already in scope here; it simply was not used.
    const statScope = await readScopeFor(orgId, 'q');
    for (const ans of answers) {
      const isCorrect = (await queryOne(`SELECT is_correct FROM client_quiz_answers WHERE id = ?`, [ans.id]))?.is_correct;
      const qbId = (await queryOne(`SELECT question_bank_id FROM client_quiz_questions WHERE id = ?`, [ans.question_id]))?.question_bank_id;
      if (qbId) {
        const col = isCorrect ? 'times_correct' : 'times_wrong';
        await query(
          `UPDATE client_qb_questions q SET q.${col} = q.${col} + 1 WHERE q.id = ? AND ${statScope.sql}`,
          [qbId, ...statScope.params]);
      }
    }

    return success(res, {
      attempt_id: attemptId, score, percentage,
      correct_count, wrong_count, skipped_count, total_marks: totalMarks,
    });
  } catch (e) {
    logger.error('submitAttempt:', e);
    return error(res, 'failed_to_submit', 500, e.message);
  }
};

// GET /api/quiz-portal/attempts/:attemptId/result
const getResult = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const { attemptId } = req.params;

    const attempt = await queryOne(
      `SELECT a.*, q.title AS test_title, q.total_marks AS test_total_marks,
              cfg.show_result_immediately, cfg.show_solution_after
       FROM client_quiz_attempts a
       JOIN client_quizzes q ON q.id = a.quiz_id
       LEFT JOIN client_quiz_config cfg ON cfg.quiz_id = a.quiz_id
       WHERE a.id = ? AND a.student_id = ? AND a.org_id = ?`,
      [attemptId, await getStudentId(userId, orgId), orgId]
    );
    if (!attempt) return error(res, 'attempt_not_found', 404);
    if (attempt.status === 'in_progress') return error(res, 'attempt_in_progress', 400);

    const items = await query(`
      SELECT qq.id AS question_id, qq.question_text, qq.question_type, qq.options,
             qq.correct_answer, qq.solution, qq.marks AS marks_positive, qq.marks_negative,
             qq.has_latex, qq.image_url, qq.difficulty, qq.sequence AS position,
             a.student_answer, a.is_correct, a.marks_obtained, a.time_spent_seconds
      FROM client_quiz_questions qq
      LEFT JOIN client_quiz_answers a ON a.question_id = qq.id AND a.attempt_id = ?
      WHERE qq.quiz_id = ?
      ORDER BY qq.sequence ASC
    `, [attemptId, attempt.quiz_id]);

    const parsed = items.map(it => ({ ...it, options: it.options ? safeJson(it.options) : null }));

    return success(res, { attempt, questions: parsed });
  } catch (e) {
    logger.error('getResult:', e);
    return error(res, 'failed_to_get_result', 500, e.message);
  }
};

// GET /api/quiz-portal/attempts/my  — list my recent attempts across all tests
const myAttempts = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.org_id;
    const rows = await query(`
      SELECT a.id, a.quiz_id, a.status, a.score, a.percentage, a.submitted_at, a.started_at,
             a.correct_count, a.wrong_count, a.skipped_count,
             q.title, q.total_marks, q.duration_minutes
      FROM client_quiz_attempts a
      JOIN client_quizzes q ON q.id = a.quiz_id
      WHERE a.student_id = ? AND a.org_id = ?
      ORDER BY a.started_at DESC
      LIMIT 30
    `, [await getStudentId(userId, orgId), orgId]);
    return success(res, { attempts: rows });
  } catch (e) {
    logger.error('myAttempts:', e);
    return error(res, 'failed_to_list_attempts', 500, e.message);
  }
};

module.exports = {
  getTestForAttempt, saveAnswer, toggleFlag, submitAttempt, getResult, myAttempts,
};

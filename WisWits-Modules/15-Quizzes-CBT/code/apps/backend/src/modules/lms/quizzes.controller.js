const { query, queryOne } = require('../../config/db');
const { success, error, paginated } = require('../../utils/response');
const logger = require('../../utils/logger');
const notifSvc = require('../../services/notificationService');
const { getActiveSchool } = require('../../utils/activeSchool');

// A teacher may only edit/delete/rewrite quizzes they CREATED. Elevated staff
// (admin/principal/…, who reach here via permission auto-pass) may touch any quiz
// in the org — only the literal `teacher` slug is owner-restricted (matches how
// teacherScope gates teacher-specific logic). Returns false → caller sends 403.
function teacherMayMutateQuiz(req, quiz) {
  const role = (req.user.role_slug || '').toLowerCase();
  if (role !== 'teacher') return true;
  return quiz.created_by === req.user.user_id;
}

// POST /api/quizzes - Create quiz
const create = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { title, description, course_id, total_marks, passing_marks, duration_minutes, negative_marking = false, available_from, available_until } = req.body;

    if (!title) return error(res, 'Quiz title required', 400);

    const result = await query(
      `INSERT INTO client_quizzes (org_id, title, description, course_id, total_marks, passing_marks, duration_minutes, negative_marking, available_from, available_until, created_by) 
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [orgId, title, description || null, course_id || null, total_marks || 0, passing_marks || 0, duration_minutes || 30, negative_marking, available_from || null, available_until || null, req.user.user_id]
    );

    await query('INSERT INTO client_audit_logs (org_id, user_id, action, entity_type, entity_id) VALUES (?,?,?,?,?)',
      [orgId, req.user.user_id, 'CREATE_QUIZ', 'quiz', result.insertId]).catch(() => {});

    const quiz = await queryOne('SELECT * FROM client_quizzes WHERE id = ?', [result.insertId]);
    logger.info(`Quiz created: ${title} (org: ${orgId})`);
    return success(res, { quiz }, 'Quiz created', 201);
  } catch (err) {
    logger.error('Create quiz error:', err);
    return error(res, 'Failed to create quiz', 500);
  }
};

// GET /api/quizzes
const list = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE q.org_id = ?';
    let params = [orgId];
    if (search) { where += ' AND q.title LIKE ?'; params.push(`%${search}%`); }
    // multi-branch: scope to the active branch via the quiz's section. A quiz with
    // no section (org-wide) stays visible to every branch. null → unchanged.
    const activeSchool = await getActiveSchool(req);
    const branchJoin = activeSchool ? ' LEFT JOIN client_sections sec ON sec.id = q.section_id' : '';
    if (activeSchool) { where += ' AND (q.section_id IS NULL OR sec.school_id = ?)'; params.push(activeSchool); }

    const countRow = await queryOne(`SELECT COUNT(*) as total FROM client_quizzes q${branchJoin} ${where}`, params);

    const quizzes = await query(
      `SELECT q.*, u.first_name as creator_name,
        COUNT(DISTINCT qq.id) as question_count,
        COUNT(DISTINCT qa.id) as attempt_count,
        ROUND(AVG(CASE WHEN qa.status = 'graded' THEN qa.percentage END), 1) as avg_score
       FROM client_quizzes q
       LEFT JOIN client_users u ON u.id = q.created_by${branchJoin}
       LEFT JOIN client_quiz_questions qq ON qq.quiz_id = q.id
       LEFT JOIN client_quiz_attempts qa ON qa.quiz_id = q.id
       ${where}
       GROUP BY q.id
       ORDER BY q.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return paginated(res, quizzes, countRow.total, page, limit, 'Quizzes fetched');
  } catch (err) {
    return error(res, 'Failed to fetch quizzes', 500);
  }
};

// GET /api/quizzes/:id
const getOne = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;

    const quiz = await queryOne(
      `SELECT q.*, u.first_name as creator_name
       FROM client_quizzes q
       LEFT JOIN client_users u ON u.id = q.created_by
       WHERE q.id = ? AND q.org_id = ?`,
      [id, orgId]
    );
    if (!quiz) return error(res, 'Quiz not found', 404);

    const questions = await query(
      `SELECT qq.*, cb.question_text as bank_question
       FROM client_quiz_questions qq
       LEFT JOIN content_question_bank cb ON cb.id = qq.question_bank_id
       WHERE qq.quiz_id = ? ORDER BY qq.sequence`,
      [id]
    );

    return success(res, { quiz, questions });
  } catch (err) {
    return error(res, 'Failed to fetch quiz', 500);
  }
};

// PUT /api/quizzes/:id
const update = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const { title, description, total_marks, passing_marks, duration_minutes, negative_marking, available_from, available_until } = req.body;

    const quiz = await queryOne('SELECT * FROM client_quizzes WHERE id = ? AND org_id = ?', [id, orgId]);
    if (!quiz) return error(res, 'Quiz not found', 404);
    if (!teacherMayMutateQuiz(req, quiz)) return error(res, 'You can only edit your own quiz', 403);

    await query(
      `UPDATE client_quizzes SET title=?, description=?, total_marks=?, passing_marks=?, duration_minutes=?, negative_marking=?, available_from=?, available_until=? WHERE id=?`,
      [title || quiz.title, description ?? quiz.description, total_marks ?? quiz.total_marks, passing_marks ?? quiz.passing_marks, duration_minutes ?? quiz.duration_minutes, negative_marking ?? quiz.negative_marking, available_from || quiz.available_from, available_until || quiz.available_until, id]
    );

    const updated = await queryOne('SELECT * FROM client_quizzes WHERE id = ?', [id]);
    return success(res, { quiz: updated }, 'Quiz updated');
  } catch (err) {
    return error(res, 'Failed to update quiz', 500);
  }
};

// DELETE /api/quizzes/:id
const remove = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;

    const quiz = await queryOne('SELECT * FROM client_quizzes WHERE id = ? AND org_id = ?', [id, orgId]);
    if (!quiz) return error(res, 'Quiz not found', 404);
    if (!teacherMayMutateQuiz(req, quiz)) return error(res, 'You can only delete your own quiz', 403);

    const attempts = await queryOne('SELECT COUNT(*) as c FROM client_quiz_attempts WHERE quiz_id = ?', [id]);
    if (attempts.c > 0) return error(res, 'Cannot delete quiz with student attempts', 400);

    await query('DELETE FROM client_quiz_questions WHERE quiz_id = ?', [id]);
    await query('DELETE FROM client_quizzes WHERE id = ? AND org_id = ?', [id, orgId]);
    return success(res, {}, 'Quiz deleted');
  } catch (err) {
    return error(res, 'Failed to delete quiz', 500);
  }
};

// POST /api/quizzes/:id/questions - Add question
const addQuestion = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const quizId = req.params.id;
    const { question_text, question_type = 'mcq', options, correct_answer, marks = 1, question_bank_id } = req.body;

    const quiz = await queryOne('SELECT * FROM client_quizzes WHERE id = ? AND org_id = ?', [quizId, orgId]);
    if (!quiz) return error(res, 'Quiz not found', 404);
    if (!teacherMayMutateQuiz(req, quiz)) return error(res, 'You can only edit your own quiz', 403);

    // Get next sequence
    const last = await queryOne('SELECT MAX(sequence) as max_seq FROM client_quiz_questions WHERE quiz_id = ?', [quizId]);
    const sequence = (last?.max_seq || 0) + 1;

    let qText = question_text;
    let qType = question_type;
    let qOptions = options ? JSON.stringify(options) : null;
    let qAnswer = correct_answer ? JSON.stringify(correct_answer) : null;
    let qMarks = marks;

    // If from question bank, pull data
    if (question_bank_id) {
      const bankQ = await queryOne('SELECT * FROM content_question_bank WHERE id = ?', [question_bank_id]);
      if (bankQ) {
        qText = qText || bankQ.question_text;
        qType = bankQ.question_type || qType;
        qOptions = qOptions || bankQ.options;
        qAnswer = qAnswer || bankQ.correct_answer;
        qMarks = bankQ.marks || qMarks;
      }
    }

    if (!qText) return error(res, 'question_text required', 400);

    const result = await query(
      'INSERT INTO client_quiz_questions (org_id, quiz_id, question_bank_id, question_text, question_type, options, correct_answer, marks, sequence) VALUES (?,?,?,?,?,?,?,?,?)',
      [orgId, quizId, question_bank_id || null, qText, qType, qOptions, qAnswer, qMarks, sequence]
    );

    // Update quiz total marks
    const totalMarks = await queryOne('SELECT SUM(marks) as total FROM client_quiz_questions WHERE quiz_id = ?', [quizId]);
    await query('UPDATE client_quizzes SET total_marks = ? WHERE id = ?', [totalMarks.total || 0, quizId]);

    const question = await queryOne('SELECT * FROM client_quiz_questions WHERE id = ?', [result.insertId]);
    return success(res, { question }, 'Question added', 201);
  } catch (err) {
    return error(res, 'Failed to add question', 500);
  }
};

// POST /api/quizzes/:id/questions/bulk - Add multiple questions
const addQuestionsBulk = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const quizId = req.params.id;
    const { questions } = req.body;

    if (!Array.isArray(questions) || !questions.length) return error(res, 'questions array required', 400);

    const quiz = await queryOne('SELECT * FROM client_quizzes WHERE id = ? AND org_id = ?', [quizId, orgId]);
    if (!quiz) return error(res, 'Quiz not found', 404);
    if (!teacherMayMutateQuiz(req, quiz)) return error(res, 'You can only edit your own quiz', 403);

    const last = await queryOne('SELECT MAX(sequence) as max_seq FROM client_quiz_questions WHERE quiz_id = ?', [quizId]);
    let seq = (last?.max_seq || 0);
    let added = 0;

    for (const q of questions) {
      try {
        seq++;
        await query(
          'INSERT INTO client_quiz_questions (org_id, quiz_id, question_bank_id, question_text, question_type, options, correct_answer, marks, sequence) VALUES (?,?,?,?,?,?,?,?,?)',
          [orgId, quizId, q.question_bank_id || null, q.question_text, q.question_type || 'mcq', q.options ? JSON.stringify(q.options) : null, q.correct_answer ? JSON.stringify(q.correct_answer) : null, q.marks || 1, seq]
        );
        added++;
      } catch { /* skip */ }
    }

    const totalMarks = await queryOne('SELECT SUM(marks) as total FROM client_quiz_questions WHERE quiz_id = ?', [quizId]);
    await query('UPDATE client_quizzes SET total_marks = ? WHERE id = ?', [totalMarks.total || 0, quizId]);

    return success(res, { added, total: questions.length }, `${added} questions added`);
  } catch (err) {
    return error(res, 'Failed to bulk add questions', 500);
  }
};

// DELETE /api/quizzes/:quizId/questions/:questionId
const removeQuestion = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id, questionId } = req.params;

    await query('DELETE FROM client_quiz_questions WHERE id = ? AND quiz_id = ? AND org_id = ?', [questionId, id, orgId]);

    const totalMarks = await queryOne('SELECT COALESCE(SUM(marks),0) as total FROM client_quiz_questions WHERE quiz_id = ?', [id]);
    await query('UPDATE client_quizzes SET total_marks = ? WHERE id = ?', [totalMarks.total, id]);

    return success(res, {}, 'Question removed');
  } catch (err) {
    return error(res, 'Failed to remove question', 500);
  }
};

// ── STUDENT QUIZ ATTEMPT ──

// GET /api/quizzes/available - Student sees available quizzes
const available = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Get student's section
    const [[studentRow]] = [await query(
      `SELECT s.id AS student_id, e.section_id FROM client_students s
       LEFT JOIN client_enrollments e ON e.student_id = s.id
       WHERE s.user_id = ? AND s.org_id = ? LIMIT 1`,
      [userId, orgId]
    )];
    const studentId = studentRow?.student_id || null;
    const sectionId = studentRow?.section_id || null;

    const quizzes = await query(
      `SELECT q.id, q.title, q.description, q.total_marks, q.duration_minutes, q.available_from, q.available_until, q.status, q.section_id,
        (SELECT COUNT(*) FROM client_quiz_questions WHERE quiz_id = q.id) AS question_count,
        (SELECT qa.id FROM client_quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = ? ORDER BY qa.id DESC LIMIT 1) AS last_attempt_id,
        (SELECT qa.status FROM client_quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = ? ORDER BY qa.id DESC LIMIT 1) AS attempt_status,
        (SELECT qa.percentage FROM client_quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = ? AND qa.status IN ('submitted','graded') ORDER BY qa.percentage DESC LIMIT 1) AS best_score
       FROM client_quizzes q
       WHERE q.org_id = ?
         AND q.status = 'published'
         AND (q.section_id IS NULL OR q.section_id = ?)
         AND (q.available_from IS NULL OR q.available_from <= ?)
         AND (q.available_until IS NULL OR q.available_until >= ?)
       ORDER BY q.created_at DESC`,
      [studentId, studentId, studentId, orgId, sectionId, now, now]
    );

    return success(res, { quizzes });
  } catch (err) {
    console.error('Available quiz error:', err);
    return error(res, 'Failed to fetch available quizzes', 500);
  }
};

// POST /api/quizzes/:id/start - Start attempt
const startAttempt = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const quizId = req.params.id;

    const quiz = await queryOne('SELECT * FROM client_quizzes WHERE id = ? AND org_id = ?', [quizId, orgId]);
    if (!quiz) return error(res, 'Quiz not found', 404);

    const student = await queryOne('SELECT id FROM client_students WHERE user_id = ? AND org_id = ?', [req.user.user_id, orgId]);
    if (!student) return error(res, 'Student profile not found', 404);

    // Check existing in-progress attempt
    const existing = await queryOne(
      'SELECT * FROM client_quiz_attempts WHERE quiz_id = ? AND student_id = ? AND status = ?',
      [quizId, student.id, 'in_progress']
    );
    if (existing) {
      const questions = await query(
        'SELECT id, question_text, question_type, options, marks, sequence FROM client_quiz_questions WHERE quiz_id = ? ORDER BY sequence',
        [quizId]
      );
      return success(res, { attempt: existing, questions });
    }

    // Create new attempt
    const result = await query(
      'INSERT INTO client_quiz_attempts (org_id, quiz_id, student_id, status) VALUES (?,?,?,?)',
      [orgId, quizId, student.id, 'in_progress']
    );

    const attempt = await queryOne('SELECT * FROM client_quiz_attempts WHERE id = ?', [result.insertId]);

    // Get questions WITHOUT correct answers
    const questions = await query(
      'SELECT id, question_text, question_type, options, marks, sequence FROM client_quiz_questions WHERE quiz_id = ? ORDER BY sequence',
      [quizId]
    );

    logger.info(`Quiz attempt started: quiz=${quizId} student=${student.id}`);
    return success(res, { attempt, questions }, 'Quiz started');
  } catch (err) {
    return error(res, 'Failed to start quiz', 500);
  }
};

// POST /api/quizzes/:id/submit - Submit answers
const submitAttempt = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const quizId = req.params.id;
    const { attempt_id, answers } = req.body;

    if (!attempt_id || !Array.isArray(answers)) return error(res, 'attempt_id and answers[] required', 400);

    const attempt = await queryOne(
      'SELECT * FROM client_quiz_attempts WHERE id = ? AND quiz_id = ? AND org_id = ? AND status = ?',
      [attempt_id, quizId, orgId, 'in_progress']
    );
    if (!attempt) return error(res, 'Active attempt not found', 404);
    // IDOR guard: the in-progress attempt must belong to the calling student —
    // else a student could submit answers into (and lock/grade) a classmate's attempt.
    const meStudent = await queryOne('SELECT id FROM client_students WHERE user_id = ? AND org_id = ?', [req.user.user_id, orgId]);
    if (!meStudent || attempt.student_id !== meStudent.id) return error(res, 'This attempt is not yours', 403);

    let totalScore = 0;
    let totalMarks = 0;

    for (const ans of answers) {
      const question = await queryOne(
        'SELECT * FROM client_quiz_questions WHERE id = ? AND quiz_id = ?',
        [ans.question_id, quizId]
      );
      if (!question) continue;

      totalMarks += parseFloat(question.marks);
      let isCorrect = false;
      let marksObtained = 0;

      // Auto-grade MCQ/true_false
      if (['mcq', 'true_false'].includes(question.question_type) && question.correct_answer) {
        // correct_answer may be JSON (["A"]) or a plain value ("A") depending on
        // how the quiz was seeded — never let submission 500 on a bad parse.
        let correct;
        try { correct = JSON.parse(question.correct_answer); }
        catch { correct = question.correct_answer; }
        const studentAns = ans.answer;

        if (Array.isArray(correct)) {
          isCorrect = correct.includes(studentAns);
        } else {
          isCorrect = correct == studentAns;
        }

        marksObtained = isCorrect ? parseFloat(question.marks) : 0;
        totalScore += marksObtained;
      }

      await query(
        'INSERT INTO client_quiz_answers (org_id, attempt_id, question_id, student_answer, is_correct, marks_obtained) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE student_answer=VALUES(student_answer), is_correct=VALUES(is_correct), marks_obtained=VALUES(marks_obtained)',
        [orgId, attempt_id, ans.question_id, JSON.stringify(ans.answer), isCorrect, marksObtained]
      );
    }

    const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100 * 100) / 100 : 0;

    await query(
      'UPDATE client_quiz_attempts SET status = ?, submitted_at = NOW(), score = ?, percentage = ? WHERE id = ?',
      ['graded', totalScore, percentage, attempt_id]
    );

    // Weak area detection: score < 60%
    if (percentage < 60) {
      const quiz = await queryOne('SELECT course_id FROM client_quizzes WHERE id = ?', [quizId]);
      if (quiz?.course_id) {
        const course = await queryOne('SELECT * FROM client_courses WHERE id = ?', [quiz.course_id]);
        if (course) {
          await query(
            'INSERT INTO client_weak_areas (org_id, student_id, chapter_id, detected_signal) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE detected_at = NOW()',
            [orgId, attempt.student_id, course.subject_id || 1, 'low_score']
          ).catch(() => {});
        }
      }
      logger.info(`Weak area detected: student=${attempt.student_id} quiz=${quizId} score=${percentage}%`);
    }

    await query('INSERT INTO client_audit_logs (org_id, user_id, action, entity_type, entity_id) VALUES (?,?,?,?,?)',
      [orgId, req.user.user_id, 'SUBMIT_QUIZ', 'quiz_attempt', attempt_id]).catch(() => {});
    // A12 analytics-only: feeds the streak/XP + learning history (SUG-0060 §2/§8)
    await query(
      `INSERT INTO client_student_activity (org_id, student_id, kind, ref_id, activity_date)
       VALUES (?,?,?,?,DATE(DATE_ADD(NOW(), INTERVAL 330 MINUTE)))`,
      [orgId, attempt.student_id, 'quiz_attempted', quizId]).catch(() => {});
    // Notify student of quiz result
    try {
      const qinfo = await queryOne('SELECT q.title, q.passing_marks, q.total_marks, a.score, a.percentage, s.id AS student_id FROM client_quiz_attempts a JOIN client_quizzes q ON q.id=a.quiz_id JOIN client_students s ON s.id=a.student_id WHERE a.id=?', [attempt_id]);
      if (qinfo) {
        const passed = qinfo.passing_marks ? qinfo.score >= qinfo.passing_marks : true;
        await notifSvc.sendToStudent(orgId, qinfo.student_id, {
          type: 'quiz_result',
          title: passed ? 'Quiz completed ✓' : 'Quiz submitted',
          body: `${qinfo.title}: scored ${qinfo.score}/${qinfo.total_marks} (${Math.round(qinfo.percentage || 0)}%)`,
          action_url: '/student/quizzes',
          icon: 'FileText',
          priority: 'normal',
          sender_id: req.user.user_id,
          sender_role: 'student',
        });
      }
    } catch (e) { /* non-fatal */ }


    logger.info(`Quiz submitted: quiz=${quizId} score=${totalScore}/${totalMarks} (${percentage}%)`);

    return success(res, {
      attempt_id,
      score: totalScore,
      total_marks: totalMarks,
      percentage,
      passed: percentage >= (((await queryOne('SELECT passing_marks FROM client_quizzes WHERE id = ?', [quizId]))?.passing_marks) || 0)
    }, 'Quiz submitted and graded');
  } catch (err) {
    logger.error('Submit quiz error:', err);
    return error(res, 'Failed to submit quiz', 500);
  }
};

// GET /api/quizzes/:id/results/:attemptId - Review attempt
const reviewAttempt = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id, attemptId } = req.params;

    const attempt = await queryOne(
      'SELECT * FROM client_quiz_attempts WHERE id = ? AND quiz_id = ? AND org_id = ?',
      [attemptId, id, orgId]
    );
    if (!attempt) return error(res, 'Attempt not found', 404);

    // IDOR guard: a student may review only THEIR OWN attempt; a parent only their
    // child's; staff may review any attempt in the org. Without this a student
    // could iterate attemptId and read classmates' answers, scores and the key.
    const reviewerRole = (req.user.role_slug || '').toLowerCase();
    if (reviewerRole === 'student') {
      const mine = await queryOne('SELECT 1 FROM client_students WHERE id=? AND org_id=? AND user_id=?', [attempt.student_id, orgId, req.user.user_id]);
      if (!mine) return error(res, 'This result is not yours', 403);
    } else if (reviewerRole === 'parent') {
      const par = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [orgId, req.user.user_id]);
      const link = par && await queryOne('SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'', [par.id, attempt.student_id]);
      if (!link) return error(res, 'This result is not for your child', 403);
    }

    // Scheduled result publish (SUG-0049b): before the set time only staff may
    // review — students/parents get the publish date instead of the result.
    // The stored DATETIME is IST wall time; compare as strings against IST now
    // (same idiom as attendance date-lock) to avoid TZ roundtrip shifts.
    const role = (req.user.role_slug || '').toLowerCase();
    if (['student', 'parent'].includes(role)) {
      const cfg = await queryOne(
        `SELECT DATE_FORMAT(result_publish_at, '%Y-%m-%d %H:%i:%s') AS publish_at,
                DATE_FORMAT(result_publish_at, '%d %b %Y, %h:%i %p') AS publish_label
           FROM client_quiz_config WHERE quiz_id = ?`, [id]).catch(() => null);
      const nowIST = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
      if (cfg?.publish_at && cfg.publish_at > nowIST) {
        return error(res, `Results will be published on ${cfg.publish_label}`, 403);
      }
    }

    const answers = await query(
      `SELECT qa.*, qq.question_text, qq.question_type, qq.options, qq.correct_answer, qq.marks, qq.sequence
       FROM client_quiz_answers qa
       INNER JOIN client_quiz_questions qq ON qq.id = qa.question_id
       WHERE qa.attempt_id = ?
       ORDER BY qq.sequence`,
      [attemptId]
    );

    const quiz = await queryOne('SELECT * FROM client_quizzes WHERE id = ?', [id]);

    return success(res, { quiz, attempt, answers });
  } catch (err) {
    return error(res, 'Failed to fetch results', 500);
  }
};

// GET /api/quizzes/:id/submissions - Teacher view all submissions
const submissions = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;

    const attempts = await query(
      `SELECT qa.*, u.first_name, u.last_name, s.admission_number
       FROM client_quiz_attempts qa
       INNER JOIN client_students s ON s.id = qa.student_id
       INNER JOIN client_users u ON u.id = s.user_id
       WHERE qa.quiz_id = ? AND qa.org_id = ?
       ORDER BY qa.percentage DESC`,
      [id, orgId]
    );

    const stats = {
      total_attempts: attempts.length,
      graded: attempts.filter(a => a.status === 'graded').length,
      avg_score: attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + (parseFloat(a.percentage) || 0), 0) / attempts.length) : 0,
      highest: attempts.length > 0 ? Math.max(...attempts.map(a => parseFloat(a.percentage) || 0)) : 0,
      lowest: attempts.length > 0 ? Math.min(...attempts.filter(a => a.status === 'graded').map(a => parseFloat(a.percentage) || 0)) : 0,
      below_60: attempts.filter(a => (parseFloat(a.percentage) || 0) < 60).length
    };

    return success(res, { attempts, stats });
  } catch (err) {
    return error(res, 'Failed to fetch submissions', 500);
  }
};

module.exports = { create, list, getOne, update, remove, addQuestion, addQuestionsBulk, removeQuestion, available, startAttempt, submitAttempt, reviewAttempt, submissions };

const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');
const { readScopeFor } = require('../qbank/libraryScope');

const TEST_TYPES = ['quiz','worksheet','dpp','mock_test','unit_test','half_yearly','final_exam','jee_mock','neet_mock'];

/*
 * Helper: pick N questions matching a difficulty mix from chapters.
 *
 * `orgId` is REQUIRED and is the first thing checked. It used not to be a
 * parameter at all: the WHERE arrays below started at
 * `['q.is_active = 1', 'q.is_private = 0']`, so auto-generating a test drew
 * from EVERY school's bank and published the results — question text, correct
 * answer and solution — into a quiz the caller's students then sat.
 *
 * services/worksheetService.js exports a function of exactly this name that
 * takes orgId as its first argument and scopes correctly. Two helpers, one
 * name, one of them tenant-blind. Hence the throw rather than a default: a
 * missing org must stop the request, not quietly widen it.
 */
async function pickQuestions({ orgId, chapter_ids, subject_id, target_class, exam_tag, total, difficulty_mix, exclude_ids = [] }) {
  if (!orgId) throw new Error('pickQuestions: orgId is required — refusing to read the bank unscoped');
  const scope = await readScopeFor(orgId, 'q');
  // difficulty_mix is { easy: %, medium: %, hard: %, extreme: % }
  const counts = {};
  let assigned = 0;
  for (const [diff, pct] of Object.entries(difficulty_mix || {})) {
    const n = Math.round((Number(pct) / 100) * total);
    counts[diff] = n;
    assigned += n;
  }
  // Adjust for rounding error — push remainder to medium
  if (assigned !== total) {
    counts.medium = (counts.medium || 0) + (total - assigned);
  }

  const picked = [];

  for (const [diff, count] of Object.entries(counts)) {
    if (count <= 0) continue;
    const where = [scope.sql, 'q.is_active = 1', 'q.is_private = 0', 'q.difficulty = ?'];
    const params = [...scope.params, diff];
    if (chapter_ids?.length) {
      where.push(`q.chapter_id IN (${chapter_ids.map(() => '?').join(',')})`);
      params.push(...chapter_ids);
    } else if (subject_id) {
      where.push('q.subject_id = ?');
      params.push(subject_id);
    }
    if (target_class) { where.push('q.target_class = ?'); params.push(target_class); }
    if (exam_tag)     { where.push('q.exam_tag = ?');     params.push(exam_tag); }
    const allExclude = [...exclude_ids, ...picked.map(p => p.id)];
    if (allExclude.length) {
      where.push(`q.id NOT IN (${allExclude.map(() => '?').join(',')})`);
      params.push(...allExclude);
    }
    const rows = await query(`
      SELECT q.id, q.question_text, q.question_type, q.options, q.correct_answer,
             q.solution, q.difficulty, q.has_latex, q.image_url, q.marks_positive, q.marks_negative,
             q.subject_id, q.chapter_id, q.topic_id
      FROM client_qb_questions q
      WHERE ${where.join(' AND ')}
      ORDER BY q.times_used ASC, RAND()
      LIMIT ?
    `, [...params, count]);
    picked.push(...rows);
  }

  // If short on questions, top up with any difficulty
  if (picked.length < total) {
    const need = total - picked.length;
    const where = [scope.sql, 'q.is_active = 1', 'q.is_private = 0'];
    const params = [...scope.params];
    if (chapter_ids?.length) {
      where.push(`q.chapter_id IN (${chapter_ids.map(() => '?').join(',')})`);
      params.push(...chapter_ids);
    } else if (subject_id) {
      where.push('q.subject_id = ?');
      params.push(subject_id);
    }
    if (target_class) { where.push('q.target_class = ?'); params.push(target_class); }
    if (exam_tag)     { where.push('q.exam_tag = ?');     params.push(exam_tag); }
    const allExclude = [...exclude_ids, ...picked.map(p => p.id)];
    if (allExclude.length) {
      where.push(`q.id NOT IN (${allExclude.map(() => '?').join(',')})`);
      params.push(...allExclude);
    }
    const fill = await query(`
      SELECT q.id, q.question_text, q.question_type, q.options, q.correct_answer,
             q.solution, q.difficulty, q.has_latex, q.image_url, q.marks_positive, q.marks_negative,
             q.subject_id, q.chapter_id, q.topic_id
      FROM client_qb_questions q
      WHERE ${where.join(' AND ')}
      ORDER BY q.times_used ASC, RAND()
      LIMIT ?
    `, [...params, need]);
    picked.push(...fill);
  }

  return picked.map(q => ({
    ...q,
    options: q.options ? safeJson(q.options) : null,
  }));
}

function safeJson(s) { try { return JSON.parse(s); } catch { return s; } }

// POST /api/quiz-portal/assessment/preview
const previewTest = async (req, res) => {
  try {
    const { subject_id, chapter_ids, target_class, exam_tag, total = 10, difficulty_mix } = req.body;

    const mix = difficulty_mix || { easy: 30, medium: 50, hard: 20, extreme: 0 };

    const picked = await pickQuestions({
      orgId: req.user.org_id,
      chapter_ids: Array.isArray(chapter_ids) ? chapter_ids : [],
      subject_id, target_class, exam_tag,
      total: Math.min(Number(total) || 10, 100),
      difficulty_mix: mix,
    });

    if (picked.length === 0) {
      return error(res, 'no_questions_match_criteria', 404,
        'No questions match. Try removing filters or different chapters.');
    }

    // Stats
    const byDiff = picked.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {});
    const totalMarks = picked.reduce((s, q) => s + Number(q.marks_positive || 4), 0);

    return success(res, {
      questions: picked,
      stats: {
        total_questions: picked.length,
        requested: total,
        total_marks: totalMarks,
        by_difficulty: byDiff,
      }
    });
  } catch (e) {
    logger.error('previewTest:', e);
    return error(res, 'failed_to_preview', 500, e.message);
  }
};

// POST /api/quiz-portal/assessment/publish
const publishTest = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const {
      title, description, test_type = 'quiz',
      subject_id, course_id, section_id,
      duration_minutes, total_marks, passing_marks,
      negative_marking,
      available_from, available_until,
      shuffle_questions, shuffle_options, show_result_immediately,
      show_solution_after, attempt_limit,
      question_ids, // explicit list from preview
    } = req.body;

    if (!title) return error(res, 'title_required', 400);
    if (!Array.isArray(question_ids) || question_ids.length === 0) {
      return error(res, 'no_questions', 400);
    }

    // Validate question access: the caller's org (or the platform library),
    // AND public-or-mine. The tenant half was missing entirely — a teacher who
    // knew or guessed another school's question ids could publish them, answer
    // keys included, straight to their own students.
    const pubScope = await readScopeFor(orgId, 'q');
    const placeholders = question_ids.map(() => '?').join(',');
    const validQs = await query(`
      SELECT q.id, q.question_text, q.question_type, q.options, q.correct_answer, q.solution,
             q.marks_positive, q.marks_negative, q.marks_partial, q.has_latex, q.image_url, q.difficulty
      FROM client_qb_questions q
      WHERE q.id IN (${placeholders}) AND ${pubScope.sql}
        AND q.is_active = 1 AND (q.is_private = 0 OR q.created_by = ?)
    `, [...question_ids, ...pubScope.params, userId]);

    if (validQs.length === 0) return error(res, 'no_valid_questions', 400);

    const computedTotalMarks = total_marks || validQs.reduce((s, q) => s + Number(q.marks_positive || 4), 0);

    // 1. Create quiz
    const quizResult = await query(`
      INSERT INTO client_quizzes
      (org_id, title, description, course_id, section_id, subject_id,
       total_marks, passing_marks, duration_minutes, negative_marking,
       available_from, available_until, created_by, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'published')
    `, [
      orgId, title, description || null,
      course_id || null, section_id || null, subject_id || null,
      computedTotalMarks, passing_marks || Math.ceil(computedTotalMarks * 0.4),
      duration_minutes || 30,
      negative_marking ? 1 : 0,
      available_from || null, available_until || null,
      userId
    ]);
    const quizId = quizResult.insertId;

    // 2. Insert quiz questions in order
    const ordered = question_ids.map(id => validQs.find(q => q.id === id)).filter(Boolean);
    for (let i = 0; i < ordered.length; i++) {
      const q = ordered[i];
      await query(`
        INSERT INTO client_quiz_questions
        (org_id, quiz_id, question_bank_id, question_text, question_type,
         options, correct_answer, solution,
         marks, marks_negative, marks_partial,
         has_latex, image_url, difficulty, sequence)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        orgId, quizId, q.id, q.question_text, q.question_type,
        q.options || null, q.correct_answer, q.solution,
        q.marks_positive || 4, q.marks_negative || 1, q.marks_partial || 0,
        q.has_latex ? 1 : 0, q.image_url, q.difficulty,
        i + 1
      ]);
      // Bump usage count. Scoped like the read that selected it: a school may
      // bump a platform-library question it just used, and nothing else. By bare
      // id this edited rows in other schools' banks.
      await query(
        `UPDATE client_qb_questions q SET q.times_used = q.times_used + 1, q.last_used_at = NOW()
          WHERE q.id = ? AND ${pubScope.sql}`,
        [q.id, ...pubScope.params]);
    }

    // 3. Insert config
    await query(`
      INSERT INTO client_quiz_config
      (quiz_id, org_id, shuffle_questions, shuffle_options,
       show_result_immediately, show_solution_after, attempt_limit)
      VALUES (?,?,?,?,?,?,?)
    `, [
      quizId, orgId,
      shuffle_questions ? 1 : 0, shuffle_options ? 1 : 0,
      show_result_immediately !== false ? 1 : 0,
      show_solution_after || 'after_window',
      attempt_limit || 1
    ]);

    return success(res, { quiz_id: quizId, question_count: ordered.length, total_marks: computedTotalMarks }, 201);
  } catch (e) {
    logger.error('publishTest:', e);
    return error(res, 'failed_to_publish', 500, e.message);
  }
};

// GET /api/quiz-portal/assessment/types
const listTestTypes = (req, res) => {
  return success(res, {
    test_types: [
      { value: 'quiz',         label: 'Quiz',          desc: 'Quick knowledge check',     emoji: '⚡', color: '#6366f1' },
      { value: 'worksheet',    label: 'Worksheet',     desc: 'Practice problems set',     emoji: '📝', color: '#10b981' },
      { value: 'dpp',          label: 'DPP',           desc: 'Daily Practice Paper',      emoji: '📅', color: '#f59e0b' },
      { value: 'mock_test',    label: 'Mock Test',     desc: 'Full simulation',           emoji: '🎯', color: '#8b5cf6' },
      { value: 'unit_test',    label: 'Unit Test',     desc: 'Chapter-end assessment',    emoji: '📘', color: '#3b82f6' },
      { value: 'half_yearly',  label: 'Half Yearly',   desc: 'Mid-year exam',             emoji: '📊', color: '#ec4899' },
      { value: 'final_exam',   label: 'Final Exam',    desc: 'Year-end exam',             emoji: '🏆', color: '#ef4444' },
      { value: 'jee_mock',     label: 'JEE Mock',      desc: 'JEE-style 90 Q · 3 hr',     emoji: '🚀', color: '#06b6d4' },
      { value: 'neet_mock',    label: 'NEET Mock',     desc: 'NEET-style 180 Q · 3.2 hr', emoji: '🩺', color: '#84cc16' },
    ]
  });
};

// GET /api/quiz-portal/assessment/templates
const listTemplates = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.org_id;
    const rows = await query(`
      SELECT id, name, description, test_type, subject_id, chapter_ids,
             difficulty_mix, total_questions, duration_minutes,
             shuffle_questions, shuffle_options, show_result_immediately,
             negative_marking, is_favorite, times_used, created_at
      FROM quiz_test_templates
      WHERE org_id = ? AND (created_by = ? OR is_favorite = 1)
      ORDER BY is_favorite DESC, times_used DESC, created_at DESC
      LIMIT 50
    `, [orgId, userId]);

    const items = rows.map(r => ({
      ...r,
      chapter_ids:    r.chapter_ids    ? safeJson(r.chapter_ids)    : [],
      difficulty_mix: r.difficulty_mix ? safeJson(r.difficulty_mix) : null,
    }));
    return success(res, { templates: items });
  } catch (e) {
    logger.error('listTemplates:', e);
    return error(res, 'failed_to_list_templates', 500, e.message);
  }
};

// POST /api/quiz-portal/assessment/templates
const saveTemplate = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.org_id;
    const b = req.body;
    if (!b.name) return error(res, 'name_required', 400);

    const result = await query(`
      INSERT INTO quiz_test_templates
      (org_id, name, description, test_type, subject_id, chapter_ids,
       difficulty_mix, total_questions, duration_minutes,
       shuffle_questions, shuffle_options, show_result_immediately,
       negative_marking, created_by, is_favorite)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      orgId, b.name, b.description || null, b.test_type || 'quiz',
      b.subject_id || null,
      b.chapter_ids    ? JSON.stringify(b.chapter_ids)    : null,
      b.difficulty_mix ? JSON.stringify(b.difficulty_mix) : null,
      b.total_questions || 10, b.duration_minutes || 30,
      b.shuffle_questions ? 1 : 0, b.shuffle_options ? 1 : 0,
      b.show_result_immediately !== false ? 1 : 0,
      b.negative_marking ? 1 : 0,
      userId,
      b.is_favorite ? 1 : 0
    ]);
    return success(res, { id: result.insertId, status: 'created' }, 201);
  } catch (e) {
    logger.error('saveTemplate:', e);
    return error(res, 'failed_to_save_template', 500, e.message);
  }
};

module.exports = { previewTest, publishTest, listTestTypes, listTemplates, saveTemplate };

// GET /api/quiz-portal/assessment/tests
const listTests = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const { test_type, status, search, mine, page = 1, limit = 30 } = req.query;

    const where = ['q.org_id = ?'];
    const params = [orgId];

    if (status)    { where.push('q.status = ?'); params.push(status); }
    if (mine === 'true') { where.push('q.created_by = ?'); params.push(userId); }
    if (search) {
      where.push('q.title LIKE ?');
      params.push(`%${search}%`);
    }

    const lim = Math.min(parseInt(limit) || 30, 100);
    const off = (Math.max(parseInt(page) || 1, 1) - 1) * lim;

    const rows = await query(`
      SELECT q.id, q.title, q.description, q.status, q.subject_id,
             q.total_marks, q.passing_marks, q.duration_minutes,
             q.negative_marking, q.available_from, q.available_until,
             q.created_at, q.created_by,
             (SELECT COUNT(*) FROM client_quiz_questions WHERE quiz_id = q.id) AS question_count,
             (SELECT COUNT(*) FROM client_quiz_attempts WHERE quiz_id = q.id) AS attempt_count,
             (SELECT ROUND(AVG(percentage),1) FROM client_quiz_attempts WHERE quiz_id = q.id AND status IN ('submitted','graded')) AS avg_score,
             cu.first_name AS creator_first_name,
             cu.last_name  AS creator_last_name,
             s.name AS subject_name
      FROM client_quizzes q
      LEFT JOIN client_users cu ON cu.id = q.created_by
      LEFT JOIN client_qb_subjects s ON s.id = q.subject_id
      WHERE ${where.join(' AND ')}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, lim, off]);

    const countRow = await queryOne(
      `SELECT COUNT(*) AS total FROM client_quizzes q WHERE ${where.join(' AND ')}`,
      params
    );
    const total = countRow?.total || 0;

    return success(res, {
      tests: rows,
      pagination: { page: parseInt(page), limit: lim, total, pages: Math.ceil(total / lim) }
    });
  } catch (e) {
    logger.error('listTests:', e);
    return error(res, 'failed_to_list_tests', 500, e.message);
  }
};

// GET /api/quiz-portal/assessment/tests/:id
const getTest = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const test = await queryOne(`
      SELECT q.*, cu.first_name AS creator_first_name, cu.last_name AS creator_last_name,
             s.name AS subject_name
      FROM client_quizzes q
      LEFT JOIN client_users cu ON cu.id = q.created_by
      LEFT JOIN client_qb_subjects s ON s.id = q.subject_id
      WHERE q.id = ? AND q.org_id = ?
    `, [id, orgId]);
    if (!test) return error(res, 'not_found', 404);

    const questions = await query(`
      SELECT id, question_text, question_type, options, correct_answer, solution,
             difficulty, marks AS marks_positive, marks_negative, has_latex, sequence AS position
      FROM client_quiz_questions
      WHERE quiz_id = ?
      ORDER BY sequence ASC
    `, [id]);

    const config = await queryOne(
      `SELECT shuffle_questions, shuffle_options, show_result_immediately, show_solution_after, attempt_limit
       FROM client_quiz_config WHERE quiz_id = ?`, [id]
    );

    const recentAttempts = await query(`
      SELECT a.id, a.student_id, a.percentage, a.score, a.status, a.submitted_at,
             u.first_name, u.last_name
      FROM client_quiz_attempts a
      LEFT JOIN client_users u ON u.id = a.student_id
      WHERE a.quiz_id = ?
      ORDER BY a.started_at DESC
      LIMIT 5
    `, [id]);

    const byDiff = questions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {});

    const parsed = questions.map(q => ({ ...q, options: q.options ? safeJson2(q.options) : null }));

    return success(res, {
      test, config: config || {}, questions: parsed,
      stats: { by_difficulty: byDiff, total_questions: questions.length },
      recent_attempts: recentAttempts,
    });
  } catch (e) {
    logger.error('getTest:', e);
    return error(res, 'failed_to_get_test', 500, e.message);
  }
};

function safeJson2(s) { try { return JSON.parse(s); } catch { return s; } }

// DELETE /api/quiz-portal/assessment/tests/:id (soft close — only creator or super_admin)
const deleteTest = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const roleSlug = req.user.role_slug;
    const { id } = req.params;
    const test = await queryOne('SELECT created_by FROM client_quizzes WHERE id = ? AND org_id = ?', [id, orgId]);
    if (!test) return error(res, 'not_found', 404);
    if (test.created_by !== userId && roleSlug !== 'super_admin') {
      return error(res, 'only_creator_can_delete', 403);
    }
    await query("UPDATE client_quizzes SET status = 'closed' WHERE id = ?", [id]);
    return success(res, { status: 'closed' });
  } catch (e) {
    logger.error('deleteTest:', e);
    return error(res, 'failed_to_delete_test', 500, e.message);
  }
};

// POST /api/quiz-portal/assessment/tests/:id/duplicate
const duplicateTest = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const { id } = req.params;
    const orig = await queryOne('SELECT * FROM client_quizzes WHERE id = ? AND org_id = ?', [id, orgId]);
    if (!orig) return error(res, 'not_found', 404);

    const newQuiz = await query(`
      INSERT INTO client_quizzes
      (org_id, title, description, course_id, section_id, subject_id,
       total_marks, passing_marks, duration_minutes, negative_marking,
       available_from, available_until, created_by, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'draft')
    `, [
      orgId, `${orig.title} (Copy)`, orig.description,
      orig.course_id, orig.section_id, orig.subject_id,
      orig.total_marks, orig.passing_marks, orig.duration_minutes,
      orig.negative_marking, null, null, userId
    ]);
    const newId = newQuiz.insertId;

    const origQs = await query('SELECT * FROM client_quiz_questions WHERE quiz_id = ? ORDER BY sequence', [id]);
    for (const q of origQs) {
      await query(`
        INSERT INTO client_quiz_questions
        (org_id, quiz_id, question_bank_id, question_text, question_type,
         options, correct_answer, solution,
         marks, marks_negative, marks_partial,
         has_latex, image_url, difficulty, sequence)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        orgId, newId, q.qb_question_id, q.question_text, q.question_type,
        q.options, q.correct_answer, q.solution,
        q.marks_positive, q.marks_negative, q.marks_partial,
        q.has_latex, q.image_url, q.difficulty, q.position
      ]);
    }

    const cfg = await queryOne('SELECT * FROM client_quiz_config WHERE quiz_id = ?', [id]);
    if (cfg) {
      await query(`
        INSERT INTO client_quiz_config
        (quiz_id, org_id, shuffle_questions, shuffle_options,
         show_result_immediately, show_solution_after, attempt_limit)
        VALUES (?,?,?,?,?,?,?)
      `, [
        newId, orgId, cfg.shuffle_questions, cfg.shuffle_options,
        cfg.show_result_immediately, cfg.show_solution_after, cfg.attempt_limit
      ]);
    }

    return success(res, { id: newId, status: 'duplicated' }, 201);
  } catch (e) {
    logger.error('duplicateTest:', e);
    return error(res, 'failed_to_duplicate', 500, e.message);
  }
};

module.exports.listTests = listTests;
module.exports.getTest = getTest;
module.exports.deleteTest = deleteTest;
module.exports.duplicateTest = duplicateTest;

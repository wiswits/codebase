const { query, queryOne } = require('../../config/db');
const { success, error, paginated } = require('../../utils/response');
const { buildSet } = require('../../utils/sqlBuild');
const logger = require('../../utils/logger');
const { readScopeFor, PLATFORM_ORG_ID } = require('../qbank/libraryScope');

function safeJson(s) {
  if (typeof s !== 'string') return s;
  try { return JSON.parse(s); } catch { return s; }
}

/*
 * Visibility is NOT tenancy, and confusing the two is what leaked this bank.
 *
 * `visibilityClause` answers "may this USER see a question their org holds" —
 * public, or private-and-mine. Every read below used it as though it also
 * answered "does this question belong to my org", and it never did. The result:
 * every school's non-private questions were listed to every other school, with
 * `creator_org_name` naming the school each came from, and `correct_answer` on
 * every row. getQuestion returned q.* — solution and source_payload included.
 *
 * The same mistake was found one function away and fixed there: getFilters
 * carries the comment "These had no org_id filter at all — a cross-tenant
 * metadata leak". Only the filters were scoped. The questions themselves, which
 * are the far worse leak, were left as they were.
 *
 * So the two clauses are now always applied together, and the tenant half comes
 * from the single shared definition in qbank/libraryScope.js rather than being
 * hand-written here — a second hand-written copy is exactly how the two files
 * drifted apart in the first place.
 */
function visibilityClause(userId, roleSlug) {
  if (roleSlug === 'super_admin') return { sql: '1=1', params: [] };
  return { sql: '(q.is_private = 0 OR q.created_by = ?)', params: [userId] };
}

/**
 * Tenant scope + visibility, in the order the params must be bound.
 * super_admin is a PLATFORM role (org 1) and is still tenant-scoped: seeing
 * every org's questions at once was never the intent, it was the bug.
 */
async function scopedVisibility(req, alias = 'q') {
  const tenant = await readScopeFor(req.user.org_id, alias);
  const vis = visibilityClause(req.user.user_id, req.user.role_slug);
  return {
    sql: `${tenant.sql} AND ${vis.sql}`,
    params: [...tenant.params, ...vis.params],
  };
}

// GET /api/quiz-portal/bank/questions
const listQuestions = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const roleSlug = req.user.role_slug;
    const {
      subject_id, chapter_id, topic_id, difficulty, exam_tag,
      question_type, target_class, search, scope,
      page = 1, limit = 20, sort = 'created_at', order = 'DESC'
    } = req.query;

    const vis = await scopedVisibility(req);
    const where = ['q.is_active = 1', vis.sql];
    const params = [...vis.params];

    if (scope === 'mine')        { where.push('q.created_by = ?'); params.push(userId); }
    if (scope === 'bookmarked')  { where.push('q.id IN (SELECT question_id FROM quiz_question_bookmarks WHERE user_id = ?)'); params.push(userId); }
    if (subject_id)    { where.push('q.subject_id = ?');    params.push(subject_id); }
    if (chapter_id)    { where.push('q.chapter_id = ?');    params.push(chapter_id); }
    if (topic_id)      { where.push('q.topic_id = ?');      params.push(topic_id); }
    if (difficulty)    { where.push('q.difficulty = ?');    params.push(difficulty); }
    if (exam_tag)      { where.push('q.exam_tag = ?');      params.push(exam_tag); }
    if (question_type) { where.push('q.question_type = ?'); params.push(question_type); }
    if (target_class)  { where.push('q.target_class = ?');  params.push(target_class); }
    if (search) {
      where.push('q.question_text LIKE ?');
      params.push(`%${search}%`);
    }

    const safeSort = ['created_at','difficulty','times_used','times_correct'].includes(sort) ? sort : 'created_at';
    const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const lim = Math.min(parseInt(limit) || 20, 100);
    const pg  = Math.max(parseInt(page) || 1, 1);
    const off = (pg - 1) * lim;

    const sql = `
      SELECT
        q.id, q.subject_id, q.chapter_id, q.topic_id,
        q.question_type, q.difficulty, q.bloom_level,
        q.exam_tag, q.target_class, q.language,
        q.question_text, q.has_latex, q.image_url,
        q.options, q.correct_answer,
        q.marks_positive, q.marks_negative,
        q.times_used, q.times_correct, q.times_wrong,
        q.created_at, q.updated_at, q.created_by, q.is_private,
        s.name AS subject_name,
        c.name AS chapter_name,
        t.name AS topic_name,
        cu.first_name AS creator_first_name,
        cu.last_name AS creator_last_name,
        co.name AS creator_org_name,
        (SELECT COUNT(*) FROM quiz_question_likes WHERE question_id = q.id) AS likes_count,
        (SELECT 1 FROM quiz_question_likes WHERE question_id = q.id AND user_id = ?) AS i_liked,
        (SELECT 1 FROM quiz_question_bookmarks WHERE question_id = q.id AND user_id = ?) AS i_bookmarked
      FROM client_qb_questions q
      LEFT JOIN client_qb_subjects s ON s.id = q.subject_id
      LEFT JOIN client_qb_chapters c ON c.id = q.chapter_id
      LEFT JOIN client_qb_topics   t ON t.id = q.topic_id
      LEFT JOIN client_users cu ON cu.id = q.created_by
      LEFT JOIN client_organizations co ON co.id = cu.org_id
      WHERE ${where.join(' AND ')}
      ORDER BY q.${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;
    const rows = await query(sql, [userId, userId, ...params, lim, off]);

    const countRow = await queryOne(
      `SELECT COUNT(*) AS total FROM client_qb_questions q WHERE ${where.join(' AND ')}`,
      params
    );
    const total = countRow?.total || 0;

    const items = rows.map(r => ({
      ...r,
      options: r.options ? safeJson(r.options) : null,
      i_liked: !!r.i_liked,
      i_bookmarked: !!r.i_bookmarked,
      can_delete: r.created_by === userId || roleSlug === 'super_admin',
    }));
    return paginated(res, items, { page: pg, limit: lim, total, pages: Math.ceil(total / lim) });
  } catch (e) {
    logger.error('quiz-portal listQuestions:', e);
    return error(res, 'failed_to_list_questions', 500, e.message);
  }
};

// GET /api/quiz-portal/bank/questions/:id
const getQuestion = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const roleSlug = req.user.role_slug;
    const { id } = req.params;
    const vis = await scopedVisibility(req);
    const q = await queryOne(`
      SELECT q.*, s.name AS subject_name, c.name AS chapter_name, t.name AS topic_name,
             cu.first_name AS creator_first_name, cu.last_name AS creator_last_name,
             co.name AS creator_org_name,
             (SELECT COUNT(*) FROM quiz_question_likes WHERE question_id = q.id) AS likes_count,
             (SELECT COUNT(*) FROM quiz_question_bookmarks WHERE question_id = q.id) AS bookmarks_count,
             (SELECT 1 FROM quiz_question_likes WHERE question_id = q.id AND user_id = ?) AS i_liked,
             (SELECT 1 FROM quiz_question_bookmarks WHERE question_id = q.id AND user_id = ?) AS i_bookmarked
      FROM client_qb_questions q
      LEFT JOIN client_qb_subjects s ON s.id = q.subject_id
      LEFT JOIN client_qb_chapters c ON c.id = q.chapter_id
      LEFT JOIN client_qb_topics   t ON t.id = q.topic_id
      LEFT JOIN client_users cu ON cu.id = q.created_by
      LEFT JOIN client_organizations co ON co.id = cu.org_id
      WHERE q.id = ? AND q.is_active = 1 AND ${vis.sql}
    `, [userId, userId, id, ...vis.params]);
    if (!q) return error(res, 'not_found', 404);
    q.options = q.options ? safeJson(q.options) : null;
    q.match_pairs = q.match_pairs ? safeJson(q.match_pairs) : null;
    q.tags_json = q.tags_json ? safeJson(q.tags_json) : null;
    q.i_liked = !!q.i_liked;
    q.i_bookmarked = !!q.i_bookmarked;
    q.can_delete = q.created_by === userId || roleSlug === 'super_admin';
    return success(res, q);
  } catch (e) {
    logger.error('quiz-portal getQuestion:', e);
    return error(res, 'failed_to_get_question', 500, e.message);
  }
};

// POST /api/quiz-portal/bank/questions
const createQuestion = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const b = req.body;
    if (!b.question_text || !b.question_type) {
      return error(res, 'missing_required_fields', 400);
    }
    const result = await query(`
      INSERT INTO client_qb_questions
      (org_id, subject_id, chapter_id, topic_id, subtopic_id,
       question_type, difficulty, bloom_level, exam_tag, target_class, language,
       source_type, source_reference,
       question_text, has_latex, image_url,
       options, correct_answer, solution, model_answer, match_pairs,
       marks_positive, marks_negative, marks_partial,
       tags_json, is_private, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      orgId, b.subject_id || null, b.chapter_id || null, b.topic_id || null, b.subtopic_id || null,
      b.question_type, b.difficulty || 'medium', b.bloom_level || 'understand',
      b.exam_tag || null, b.target_class || null, b.language || 'en',
      b.source_type || 'original', b.source_reference || null,
      b.question_text, b.has_latex ? 1 : 0, b.image_url || null,
      b.options ? JSON.stringify(b.options) : null,
      b.correct_answer || null, b.solution || null, b.model_answer || null,
      b.match_pairs ? JSON.stringify(b.match_pairs) : null,
      b.marks_positive || 4, b.marks_negative || 1, b.marks_partial || 0,
      b.tags_json ? JSON.stringify(b.tags_json) : null,
      b.is_private ? 1 : 0,
      userId
    ]);
    return success(res, { id: result.insertId, status: 'created' }, 201);
  } catch (e) {
    logger.error('quiz-portal createQuestion:', e);
    return error(res, 'failed_to_create', 500, e.message);
  }
};

// PATCH — only creator can edit
const updateQuestion = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const roleSlug = req.user.role_slug;
    const { id } = req.params;
    const b = req.body;

    // `created_by` is an AUTHORSHIP check, not a tenant one. It held the line
    // here only because user ids happen to be globally unique — relax the gate
    // by an inch ("let a head of department edit their subject's questions")
    // and it becomes a cross-tenant write with nothing behind it. And it never
    // constrained super_admin, which could edit any org's row by id.
    //
    // The org filter is deliberately NOT the library scope: a write must reach
    // the caller's own org and nowhere else, so a platform-library row cannot
    // be edited by a school no matter who is listed as its creator.
    const owned = await queryOne(
      'SELECT created_by FROM client_qb_questions WHERE id = ? AND org_id = ?', [id, req.user.org_id]);
    if (!owned) return error(res, 'not_found', 404);
    if (owned.created_by !== userId && roleSlug !== 'super_admin') {
      return error(res, 'forbidden_not_creator', 403);
    }

    const allowed = ['subject_id','chapter_id','topic_id','subtopic_id','question_type','difficulty',
      'bloom_level','exam_tag','target_class','language','source_type','source_reference',
      'question_text','has_latex','image_url','correct_answer','solution','model_answer',
      'marks_positive','marks_negative','marks_partial','is_private'];
    const built = buildSet(allowed, b);
    const sets = built.clause ? [built.clause] : [];
    const params = [...built.values];
    if ('options'     in b) { sets.push('options = ?');     params.push(b.options     ? JSON.stringify(b.options)     : null); }
    if ('match_pairs' in b) { sets.push('match_pairs = ?'); params.push(b.match_pairs ? JSON.stringify(b.match_pairs) : null); }
    if ('tags_json'   in b) { sets.push('tags_json = ?');   params.push(b.tags_json   ? JSON.stringify(b.tags_json)   : null); }
    if (!sets.length) return error(res, 'nothing_to_update', 400);

    // Scoped again on the statement itself, not only on the lookup above. Two
    // independent lines mean a relaxed gate cannot on its own reach another
    // tenant's row.
    params.push(id, req.user.org_id);
    await query(`UPDATE client_qb_questions SET ${sets.join(', ')} WHERE id = ? AND org_id = ?`, params);
    return success(res, { status: 'updated' });
  } catch (e) {
    logger.error('quiz-portal updateQuestion:', e);
    return error(res, 'failed_to_update', 500, e.message);
  }
};

// DELETE — strict: only original creator (or super_admin)
const deleteQuestion = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const roleSlug = req.user.role_slug;
    const { id } = req.params;
    // Same reasoning as updateQuestion: authorship is not tenancy, and a
    // platform-library row must not be deletable by a school.
    const owned = await queryOne(
      'SELECT created_by FROM client_qb_questions WHERE id = ? AND org_id = ?', [id, req.user.org_id]);
    if (!owned) return error(res, 'not_found', 404);
    if (owned.created_by !== userId && roleSlug !== 'super_admin') {
      return error(res, 'only_creator_can_delete', 403);
    }
    await query('UPDATE client_qb_questions SET is_active = 0 WHERE id = ? AND org_id = ?',
      [id, req.user.org_id]);
    return success(res, { status: 'deleted' });
  } catch (e) {
    logger.error('quiz-portal deleteQuestion:', e);
    return error(res, 'failed_to_delete', 500, e.message);
  }
};

// POST /questions/:id/like (toggle)
const toggleLike = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;
    const existing = await queryOne('SELECT id FROM quiz_question_likes WHERE question_id = ? AND user_id = ?', [id, userId]);
    if (existing) {
      await query('DELETE FROM quiz_question_likes WHERE id = ?', [existing.id]);
      return success(res, { liked: false });
    }
    await query('INSERT INTO quiz_question_likes (question_id, user_id) VALUES (?, ?)', [id, userId]);
    return success(res, { liked: true });
  } catch (e) {
    logger.error('toggleLike:', e);
    return error(res, 'failed_to_toggle_like', 500, e.message);
  }
};

// POST /questions/:id/bookmark (toggle)
const toggleBookmark = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;
    const existing = await queryOne('SELECT id FROM quiz_question_bookmarks WHERE question_id = ? AND user_id = ?', [id, userId]);
    if (existing) {
      await query('DELETE FROM quiz_question_bookmarks WHERE id = ?', [existing.id]);
      return success(res, { bookmarked: false });
    }
    await query('INSERT INTO quiz_question_bookmarks (question_id, user_id) VALUES (?, ?)', [id, userId]);
    return success(res, { bookmarked: true });
  } catch (e) {
    logger.error('toggleBookmark:', e);
    return error(res, 'failed_to_toggle_bookmark', 500, e.message);
  }
};

// GET /filters — global scope (no org filter)
const getFilters = async (req, res) => {
  try {
    // These had no org_id filter at all — a cross-tenant metadata leak (every
    // org's subject/chapter/topic names were merged together).
    const orgId = req.user.org_id;
    const [subjects, chapters, topics, difficulties, examTags, classes] = await Promise.all([
      query('SELECT DISTINCT s.id, s.name FROM client_qb_subjects s INNER JOIN client_qb_questions q ON q.subject_id = s.id WHERE q.is_active = 1 AND q.is_private = 0 AND q.org_id = ? ORDER BY s.name', [orgId]),
      query('SELECT DISTINCT c.id, c.name, c.subject_id FROM client_qb_chapters c INNER JOIN client_qb_questions q ON q.chapter_id = c.id WHERE q.is_active = 1 AND q.is_private = 0 AND q.org_id = ? ORDER BY c.name', [orgId]),
      query('SELECT DISTINCT t.id, t.name, t.chapter_id FROM client_qb_topics t INNER JOIN client_qb_questions q ON q.topic_id = t.id WHERE q.is_active = 1 AND q.is_private = 0 AND q.org_id = ? ORDER BY t.name', [orgId]),
      query(`SELECT DISTINCT difficulty FROM client_qb_questions WHERE is_active = 1 AND is_private = 0 AND org_id = ? AND difficulty IS NOT NULL`, [orgId]),
      query(`SELECT DISTINCT exam_tag FROM client_qb_questions WHERE is_active = 1 AND is_private = 0 AND org_id = ? AND exam_tag IS NOT NULL`, [orgId]),
      query(`SELECT DISTINCT target_class FROM client_qb_questions WHERE is_active = 1 AND is_private = 0 AND org_id = ? AND target_class IS NOT NULL`, [orgId]),
    ]);
    return success(res, {
      subjects, chapters, topics,
      difficulties: difficulties.map(d => d.difficulty),
      exam_tags:    examTags.map(e => e.exam_tag),
      classes:      classes.map(c => c.target_class),
      question_types: ['mcq_single','mcq_multi','integer','assertion_reason','match_column','subjective'],
      bloom_levels:   ['remember','understand','apply','analyze','evaluate','create'],
    });
  } catch (e) {
    logger.error('quiz-portal getFilters:', e);
    return error(res, 'failed_to_get_filters', 500, e.message);
  }
};

// GET /stats — community + personal
const getStats = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const vis = await scopedVisibility(req);

    const [total, mine, bookmarks, attempts] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS c FROM client_qb_questions q WHERE q.is_active = 1 AND ${vis.sql}`, vis.params),
      // `created_by = me` is already a tenant scope — a user belongs to one org
      // — but it is spelled out so this query cannot be read as an exception to
      // the rule that every question read names an org.
      queryOne(`SELECT COUNT(*) AS c FROM client_qb_questions q WHERE q.is_active = 1 AND q.org_id = ? AND q.created_by = ?`, [req.user.org_id, userId]),
      queryOne(`SELECT COUNT(*) AS c FROM quiz_question_bookmarks WHERE user_id = ?`, [userId]),
      queryOne(`SELECT COUNT(*) AS c FROM client_quiz_attempts WHERE org_id = ?`, [req.user.org_id]),
    ]);
    return success(res, {
      questions: total?.c || 0,
      my_questions: mine?.c || 0,
      bookmarks: bookmarks?.c || 0,
      attempts: attempts?.c || 0,
    });
  } catch (e) {
    logger.error('quiz-portal getStats:', e);
    return error(res, 'failed_to_get_stats', 500, e.message);
  }
};

module.exports = {
  listQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion,
  toggleLike, toggleBookmark, getFilters, getStats,
};

// POST /api/quiz-portal/bank/import-bulk
const importBulk = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const { questions, default_subject_id, default_chapter_id, default_class, default_exam_tag } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return error(res, 'no_questions_provided', 400);
    }
    if (questions.length > 100) {
      return error(res, 'max_100_per_import', 400);
    }

    const results = { created: 0, failed: 0, errors: [] };

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      try {
        if (!q.question_text || !q.question_type) {
          results.failed++;
          results.errors.push({ index: i, error: 'missing question_text or question_type' });
          continue;
        }
        // Auto-detect LaTeX
        const hasLatex = /\$.*\$/.test(q.question_text) || /\$.*\$/.test(q.solution || '');
        await query(`
          INSERT INTO client_qb_questions
          (org_id, subject_id, chapter_id, topic_id,
           question_type, difficulty, bloom_level, exam_tag, target_class, language,
           source_type, question_text, has_latex,
           options, correct_answer, solution,
           marks_positive, marks_negative,
           is_private, created_by)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, [
          orgId,
          q.subject_id || default_subject_id || null,
          q.chapter_id || default_chapter_id || null,
          q.topic_id || null,
          q.question_type,
          q.difficulty || 'medium',
          q.bloom_level || 'understand',
          q.exam_tag || default_exam_tag || null,
          q.target_class || default_class || null,
          q.language || 'en',
          'adapted',
          q.question_text,
          hasLatex ? 1 : 0,
          q.options ? JSON.stringify(q.options) : null,
          q.correct_answer || null,
          q.solution || null,
          q.marks_positive || 4,
          q.marks_negative || 1,
          q.is_private ? 1 : 0,
          userId
        ]);
        results.created++;
      } catch (e) {
        results.failed++;
        results.errors.push({ index: i, error: e.message });
      }
    }

    return success(res, results);
  } catch (e) {
    logger.error('importBulk:', e);
    return error(res, 'failed_to_import', 500, e.message);
  }
};

module.exports.importBulk = importBulk;

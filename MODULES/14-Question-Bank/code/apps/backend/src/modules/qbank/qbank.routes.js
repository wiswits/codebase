const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const logger = require('../../utils/logger');
const { audit } = require('../../utils/audit');
const { readScope, readScopeFor, libraryEnabled, TAXONOMY, PLATFORM_ORG_ID } = require('./libraryScope');

router.use(authenticate);
router.use(requirePermission('quizzes.create'));

/*
 * READ routes below use `readScopeFor(org, alias)` instead of a bare
 * `org_id = ?`. That is the ONE sanctioned widening in this codebase: a school
 * switched on for the platform library reads its own rows plus the library's,
 * and nothing else ever. The guarantee lives in libraryScope.js and is asserted
 * exhaustively in tests/qbank-library-scope.test.js.
 *
 * WRITE routes (POST/PUT/DELETE) below keep their unchanged `org_id = ?` with
 * the caller's org. A platform row therefore does not match a school's UPDATE or
 * DELETE and the route 404s — which is how "read-only" is enforced. Do not
 * "tidy" a write route into readScopeFor; that would hand every enabled school
 * edit rights over the master bank. tests/qbank-library-writes.test.js fails if
 * anyone does.
 */

// Rows come back from either org; the UI needs to know which are read-only.
// Derived in JS rather than as an extra SELECT expression so no route has to
// juggle another positional parameter into an already-ordered params array.
const markPlatform = (rows) => {
  for (const r of rows) r.is_platform = Number(r.org_id) === PLATFORM_ORG_ID ? 1 : 0;
  return rows;
};

// ─── TAXONOMY ──────────────────────────────────────────────────────────────
router.get('/subjects', async (req, res) => {
  try {
    const o = req.user.org_id;
    const scope = await readScopeFor(o, 's', TAXONOMY);
    const rows = await query(
      `SELECT s.*, COUNT(q.id) AS question_count
       FROM client_qb_subjects s
       LEFT JOIN client_qb_questions q ON q.subject_id=s.id AND q.is_active=1
       WHERE ${scope.sql} AND s.is_active=1
       GROUP BY s.id ORDER BY s.sort_order, s.name`,
      [...scope.params]
    );
    return success(res, { subjects: markPlatform(rows) });
  } catch(e) { return error(res, e.message, 500); }
});

router.post('/subjects', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { name, short_code, icon, color } = req.body;
    if (!name) return error(res, 'name required', 400);
    const r = await query(
      `INSERT INTO client_qb_subjects (org_id, name, short_code, icon, color) VALUES (?,?,?,?,?)`,
      [o, name, short_code||null, icon||'BookOpen', color||'#3b82f6']
    );
    return success(res, { id: r.insertId }, 'Subject created', 201);
  } catch(e) { return error(res, e.message, 500); }
});

router.get('/chapters', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { subject_id } = req.query;
    const scope = await readScopeFor(o, 'c', TAXONOMY);
    let where = `WHERE ${scope.sql} AND c.is_active=1`;
    const p = [...scope.params];
    if (subject_id) { where += ' AND c.subject_id=?'; p.push(subject_id); }
    const rows = await query(
      `SELECT c.*, COUNT(q.id) AS question_count
       FROM client_qb_chapters c
       LEFT JOIN client_qb_questions q ON q.chapter_id=c.id AND q.is_active=1
       ${where}
       GROUP BY c.id ORDER BY c.sort_order, c.name`,
      p
    );
    return success(res, { chapters: markPlatform(rows) });
  } catch(e) { return error(res, e.message, 500); }
});

router.post('/chapters', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { subject_id, name, target_class } = req.body;
    if (!subject_id || !name) return error(res, 'subject_id and name required', 400);
    const r = await query(
      `INSERT INTO client_qb_chapters (org_id, subject_id, name, target_class) VALUES (?,?,?,?)`,
      [o, subject_id, name, target_class||null]
    );
    return success(res, { id: r.insertId }, 'Chapter created', 201);
  } catch(e) { return error(res, e.message, 500); }
});

router.get('/topics', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { chapter_id } = req.query;
    const scope = await readScopeFor(o, 't', TAXONOMY);
    let where = `WHERE ${scope.sql} AND t.is_active=1`;
    const p = [...scope.params];
    if (chapter_id) { where += ' AND t.chapter_id=?'; p.push(chapter_id); }
    const rows = await query(
      `SELECT t.*, COUNT(q.id) AS question_count
       FROM client_qb_topics t
       LEFT JOIN client_qb_questions q ON q.topic_id=t.id AND q.is_active=1
       ${where}
       GROUP BY t.id ORDER BY t.sort_order, t.name`,
      p
    );
    return success(res, { topics: markPlatform(rows) });
  } catch(e) { return error(res, e.message, 500); }
});

router.post('/topics', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { chapter_id, name } = req.body;
    const r = await query(
      `INSERT INTO client_qb_topics (org_id, chapter_id, name) VALUES (?,?,?)`,
      [o, chapter_id, name]
    );
    return success(res, { id: r.insertId }, 'Topic created', 201);
  } catch(e) { return error(res, e.message, 500); }
});

// ─── TREE (everything collapsed into one call) ────────────────────────────
router.get('/tree', async (req, res) => {
  try {
    const o = req.user.org_id;
    // One flag lookup for all three levels — resolved once, then reused with a
    // different alias each time. Three separate readScopeFor calls would be
    // three chances for the flag to change mid-request and return a tree whose
    // chapters have no subject.
    const enabled = await libraryEnabled(o);
    const sScope = readScope(o, enabled, 's', TAXONOMY);
    const cScope = readScope(o, enabled, 'c', TAXONOMY);
    const tScope = readScope(o, enabled, 't', TAXONOMY);
    const subjects = await query(
      `SELECT s.*, COUNT(q.id) AS question_count
       FROM client_qb_subjects s
       LEFT JOIN client_qb_questions q ON q.subject_id=s.id AND q.is_active=1
       WHERE ${sScope.sql} AND s.is_active=1
       GROUP BY s.id ORDER BY s.sort_order`, [...sScope.params]
    );
    const chapters = await query(
      `SELECT c.*, COUNT(q.id) AS question_count
       FROM client_qb_chapters c
       LEFT JOIN client_qb_questions q ON q.chapter_id=c.id AND q.is_active=1
       WHERE ${cScope.sql} AND c.is_active=1
       GROUP BY c.id ORDER BY c.sort_order`, [...cScope.params]
    );
    const topics = await query(
      `SELECT t.*, COUNT(q.id) AS question_count
       FROM client_qb_topics t
       LEFT JOIN client_qb_questions q ON q.topic_id=t.id AND q.is_active=1
       WHERE ${tScope.sql} AND t.is_active=1
       GROUP BY t.id ORDER BY t.sort_order`, [...tScope.params]
    );
    return success(res, {
      subjects: markPlatform(subjects),
      chapters: markPlatform(chapters),
      topics: markPlatform(topics),
    });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── QUESTIONS: LIST + FILTER + SEARCH ─────────────────────────────────────
router.get('/questions', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { subject_id, chapter_id, topic_id, question_type, difficulty, exam_tag, target_class, search, limit=50, offset=0 } = req.query;
    
    const scope = await readScopeFor(o, 'q');
    let where = `WHERE ${scope.sql} AND q.is_active=1`;
    const p = [...scope.params];
    if (subject_id)    { where += ' AND q.subject_id=?';    p.push(subject_id); }
    if (chapter_id)    { where += ' AND q.chapter_id=?';    p.push(chapter_id); }
    if (topic_id)      { where += ' AND q.topic_id=?';      p.push(topic_id); }
    if (question_type) { where += ' AND q.question_type=?'; p.push(question_type); }
    if (difficulty)    { where += ' AND q.difficulty=?';    p.push(difficulty); }
    if (exam_tag)      { where += ' AND q.exam_tag=?';      p.push(exam_tag); }
    if (target_class)  { where += ' AND q.target_class=?';  p.push(target_class); }
    if (search)        { where += ' AND q.question_text LIKE ?'; p.push(`%${search}%`); }

    const countR = await queryOne(`SELECT COUNT(*) AS total FROM client_qb_questions q ${where}`, p);

    // LIMIT/OFFSET are interpolated, not bound. `pool.execute` uses the binary
    // prepared-statement protocol, and MySQL 9 rejects a bound LIMIT outright
    // ("Incorrect arguments to mysqld_stmt_execute") — so this route 500s on a
    // dev machine running MySQL while working on the MariaDB servers. Both are
    // integers here: parseInt then clamp, so nothing but a number can reach the
    // string, and §17's "never build SQL by concatenation" is not in play.
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const off = Math.max(parseInt(offset, 10) || 0, 0);

    const rows = await query(
      `SELECT q.*,
        s.name AS subject_name, s.color AS subject_color, s.icon AS subject_icon,
        c.name AS chapter_name,
        t.name AS topic_name
       FROM client_qb_questions q
       LEFT JOIN client_qb_subjects s ON s.id=q.subject_id
       LEFT JOIN client_qb_chapters c ON c.id=q.chapter_id
       LEFT JOIN client_qb_topics t ON t.id=q.topic_id
       ${where}
       ORDER BY q.updated_at DESC
       LIMIT ${lim} OFFSET ${off}`,
      p
    );

    // Parse JSON columns
    rows.forEach(r => {
      if (r.options) { try { r.options = JSON.parse(r.options); } catch { r.options = []; } }
      if (r.match_pairs) { try { r.match_pairs = JSON.parse(r.match_pairs); } catch {} }
      // `source_payload` is the verbatim original of an imported question — a
      // multi-KB blob per row that only the single-question view (used for
      // cross-checking against the source) has any use for. Shipping it on a
      // 50-row list would put megabytes on the wire for nothing.
      delete r.source_payload;
    });
    markPlatform(rows);

    return success(res, {
      questions: rows,
      total: countR.total,
      limit: lim,
      offset: off,
    });
  } catch(e) { logger.error('QB list:', e); return error(res, e.message, 500); }
});

// ─── SINGLE QUESTION ───────────────────────────────────────────────────────
router.get('/questions/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const scope = await readScopeFor(o, 'q');
    const q = await queryOne(
      `SELECT q.*,
        s.name AS subject_name, c.name AS chapter_name, t.name AS topic_name,
        CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS created_by_name
       FROM client_qb_questions q
       LEFT JOIN client_qb_subjects s ON s.id=q.subject_id
       LEFT JOIN client_qb_chapters c ON c.id=q.chapter_id
       LEFT JOIN client_qb_topics t ON t.id=q.topic_id
       LEFT JOIN client_users u ON u.id=q.created_by
       WHERE q.id=? AND ${scope.sql}`,
      [req.params.id, ...scope.params]
    );
    if (!q) return error(res, 'Question not found', 404);
    markPlatform([q]);

    if (q.options) { try { q.options = JSON.parse(q.options); } catch { q.options = []; } }
    if (q.match_pairs) { try { q.match_pairs = JSON.parse(q.match_pairs); } catch {} }

    const tags = await query('SELECT tag FROM client_qb_tags WHERE question_id=?', [req.params.id]);
    q.tags = tags.map(t => t.tag);

    return success(res, { question: q });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── CREATE ────────────────────────────────────────────────────────────────
router.post('/questions', async (req, res) => {
  try {
    const o = req.user.org_id;
    const {
      subject_id, chapter_id, topic_id, subtopic_id,
      question_type, difficulty, bloom_level, exam_tag, target_class, source_type,
      question_text, has_latex, image_url,
      options, correct_answer, solution, model_answer, match_pairs,
      marks_positive, marks_negative, marks_partial, tags
    } = req.body;

    if (!question_text || !question_type) return error(res, 'question_text and question_type required', 400);

    const r = await query(
      `INSERT INTO client_qb_questions (
        org_id, subject_id, chapter_id, topic_id, subtopic_id,
        question_type, difficulty, bloom_level, exam_tag, target_class, source_type,
        question_text, has_latex, image_url,
        options, correct_answer, solution, model_answer, match_pairs,
        marks_positive, marks_negative, marks_partial, created_by
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        o, subject_id||null, chapter_id||null, topic_id||null, subtopic_id||null,
        question_type, difficulty||'medium', bloom_level||'understand',
        exam_tag||null, target_class||null, source_type||'original',
        question_text, has_latex?1:0, image_url||null,
        options ? JSON.stringify(options) : null,
        correct_answer||null, solution||null, model_answer||null,
        match_pairs ? JSON.stringify(match_pairs) : null,
        marks_positive||4, marks_negative||1, marks_partial||0,
        req.user.user_id
      ]
    );

    if (Array.isArray(tags) && tags.length > 0) {
      for (const t of tags) {
        await query('INSERT INTO client_qb_tags (org_id, question_id, tag) VALUES (?,?,?)', [o, r.insertId, t]);
      }
    }

    return success(res, { id: r.insertId }, 'Question created', 201);
  } catch(e) { logger.error('QB create:', e); return error(res, e.message, 500); }
});

// Ownership rule (SUG-0052): questions live in the COMMON org bank, but a
// teacher may edit/delete only questions THEY created. Elevated staff manage all.
const QB_ELEVATED = ['owner','admin','principal','coordinator','hod','super_admin','system_admin'];
function ownsQuestion(user, existing) {
  const elevated = QB_ELEVATED.includes((user.role_slug || '').toLowerCase());
  return elevated || !existing.created_by || existing.created_by === user.user_id;
}

// ─── UPDATE ────────────────────────────────────────────────────────────────
router.put('/questions/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const existing = await queryOne('SELECT * FROM client_qb_questions WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!existing) return error(res, 'Not found', 404);
    if (!ownsQuestion(req.user, existing)) return error(res, 'You can only edit questions you created', 403);

    // Snapshot for history
    await query('INSERT INTO client_qb_question_history (question_id, org_id, changed_by, change_summary, snapshot) VALUES (?,?,?,?,?)',
      [req.params.id, o, req.user.user_id, 'Updated', JSON.stringify(existing)]);

    const {
      subject_id, chapter_id, topic_id, question_type, difficulty, bloom_level,
      exam_tag, target_class, question_text, has_latex, options, correct_answer,
      solution, model_answer, match_pairs, marks_positive, marks_negative
    } = req.body;

    await query(
      `UPDATE client_qb_questions SET
        subject_id=COALESCE(?,subject_id), chapter_id=COALESCE(?,chapter_id),
        topic_id=COALESCE(?,topic_id),
        question_type=COALESCE(?,question_type), difficulty=COALESCE(?,difficulty),
        bloom_level=COALESCE(?,bloom_level), exam_tag=COALESCE(?,exam_tag),
        target_class=COALESCE(?,target_class),
        question_text=COALESCE(?,question_text), has_latex=COALESCE(?,has_latex),
        options=COALESCE(?,options), correct_answer=COALESCE(?,correct_answer),
        solution=COALESCE(?,solution), model_answer=COALESCE(?,model_answer),
        match_pairs=COALESCE(?,match_pairs),
        marks_positive=COALESCE(?,marks_positive), marks_negative=COALESCE(?,marks_negative),
        version=version+1
       WHERE id=? AND org_id=?`,
      [
        subject_id||null, chapter_id||null, topic_id||null,
        question_type||null, difficulty||null, bloom_level||null,
        exam_tag||null, target_class||null,
        question_text||null, has_latex!==undefined?(has_latex?1:0):null,
        options ? JSON.stringify(options) : null,
        correct_answer||null, solution||null, model_answer||null,
        match_pairs ? JSON.stringify(match_pairs) : null,
        marks_positive||null, marks_negative||null,
        req.params.id, o
      ]
    );

    return success(res, {}, 'Question updated');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── DELETE (soft) — owner or elevated only ────────────────────────────────
router.delete('/questions/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const existing = await queryOne('SELECT created_by FROM client_qb_questions WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!existing) return error(res, 'Not found', 404);
    if (!ownsQuestion(req.user, existing)) return error(res, 'You can only delete questions you created', 403);
    await query('UPDATE client_qb_questions SET is_active=0 WHERE id=? AND org_id=?', [req.params.id, o]);
    return success(res, {}, 'Question deleted');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── BULK CSV IMPORT ───────────────────────────────────────────────────────
router.post('/questions/bulk-import', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { rows } = req.body;
    if (!Array.isArray(rows)) return error(res, 'rows[] required', 400);

    let imported = 0, failed = 0;
    const errors = [];

    for (const row of rows) {
      try {
        // Resolve subject/chapter/topic by name
        let subjectId = null, chapterId = null, topicId = null;
        if (row.subject) {
          const s = await queryOne('SELECT id FROM client_qb_subjects WHERE org_id=? AND name=?', [o, row.subject]);
          subjectId = s?.id;
        }
        if (row.chapter && subjectId) {
          const c = await queryOne('SELECT id FROM client_qb_chapters WHERE org_id=? AND subject_id=? AND name=?', [o, subjectId, row.chapter]);
          chapterId = c?.id;
          if (!chapterId) {
            const newC = await query('INSERT INTO client_qb_chapters (org_id, subject_id, name, target_class) VALUES (?,?,?,?)',
              [o, subjectId, row.chapter, row.target_class||null]);
            chapterId = newC.insertId;
          }
        }
        if (row.topic && chapterId) {
          const t = await queryOne('SELECT id FROM client_qb_topics WHERE org_id=? AND chapter_id=? AND name=?', [o, chapterId, row.topic]);
          topicId = t?.id;
          if (!topicId) {
            const newT = await query('INSERT INTO client_qb_topics (org_id, chapter_id, name) VALUES (?,?,?)', [o, chapterId, row.topic]);
            topicId = newT.insertId;
          }
        }

        let opts = null;
        if (row.options) {
          if (typeof row.options === 'string') {
            opts = row.options.split('|').map(s => s.trim());
          } else if (Array.isArray(row.options)) {
            opts = row.options;
          }
        }

        await query(
          `INSERT INTO client_qb_questions (
            org_id, subject_id, chapter_id, topic_id,
            question_type, difficulty, bloom_level, exam_tag, target_class,
            question_text, has_latex, options, correct_answer, solution,
            marks_positive, marks_negative, created_by
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            o, subjectId, chapterId, topicId,
            row.question_type || 'mcq_single',
            row.difficulty || 'medium',
            row.bloom_level || 'understand',
            row.exam_tag || null,
            row.target_class || null,
            row.question_text || row.question || '',
            (row.has_latex || row.question_text?.includes('$')) ? 1 : 0,
            opts ? JSON.stringify(opts) : null,
            row.correct_answer || row.correct || null,
            row.solution || null,
            parseFloat(row.marks_positive) || 4,
            parseFloat(row.marks_negative) || 1,
            req.user.user_id
          ]
        );
        imported++;
      } catch(e) {
        failed++;
        errors.push({ row: row.question_text?.substring(0,50), error: e.message });
      }
    }

    await audit(req, 'QUESTION_IMPORT', 'question_bank', null, { new_data: { imported, failed, total: rows.length } });

    return success(res, { imported, failed, errors: errors.slice(0, 10) }, `Imported ${imported} of ${rows.length}`);
  } catch(e) { return error(res, e.message, 500); }
});

// ─── STATS ─────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const o = req.user.org_id;
    const enabled = await libraryEnabled(o);
    // Aliased `q` even where there is no join, so one scope shape covers every
    // query here and none of them can drift to an unaliased column.
    const qs = readScope(o, enabled, 'q');
    const ss = readScope(o, enabled, 's', TAXONOMY);
    // Counted in three parts on purpose. A single widened total tells a school
    // that wrote 14 questions that it has 9,350 — technically the number it can
    // see, and a lie about what it owns. The split lets the UI say "14 yours +
    // 9,336 from the WisWits library" and never has to pick which one to hide.
    const own = readScope(o, false, 'q');
    const totalOwn = await queryOne(
      `SELECT COUNT(*) AS n FROM client_qb_questions q WHERE ${own.sql} AND q.is_active=1`, [...own.params]);
    const totalAll = await queryOne(
      `SELECT COUNT(*) AS n FROM client_qb_questions q WHERE ${qs.sql} AND q.is_active=1`, [...qs.params]);
    const bySubject = await query(
      `SELECT s.name, s.color, COUNT(q.id) AS cnt
       FROM client_qb_subjects s
       LEFT JOIN client_qb_questions q ON q.subject_id=s.id AND q.is_active=1
       WHERE ${ss.sql} AND s.is_active=1
       GROUP BY s.id ORDER BY cnt DESC`, [...ss.params]
    );
    const byType = await query(
      `SELECT q.question_type, COUNT(*) AS cnt FROM client_qb_questions q
       WHERE ${qs.sql} AND q.is_active=1 GROUP BY q.question_type`, [...qs.params]
    );
    const byDifficulty = await query(
      `SELECT q.difficulty, COUNT(*) AS cnt FROM client_qb_questions q
       WHERE ${qs.sql} AND q.is_active=1 GROUP BY q.difficulty`, [...qs.params]
    );
    const byExam = await query(
      `SELECT q.exam_tag, COUNT(*) AS cnt FROM client_qb_questions q
       WHERE ${qs.sql} AND q.is_active=1 AND q.exam_tag IS NOT NULL GROUP BY q.exam_tag ORDER BY cnt DESC`, [...qs.params]
    );
    return success(res, {
      total: totalAll.n,
      own_total: totalOwn.n,
      library_total: totalAll.n - totalOwn.n,
      library_enabled: enabled,
      by_subject: bySubject,
      by_type: byType,
      by_difficulty: byDifficulty,
      by_exam: byExam,
    });
  } catch(e) { return error(res, e.message, 500); }
});

module.exports = router;

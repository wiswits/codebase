const express = require('express');
const router = express.Router();
const teachingService = require('../../services/teachingService');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { success, error } = require('../../utils/response');
const { query } = require('../../config/db');
const logger = require('../../utils/logger');
const { assertOrgOwns } = require('../../core/multi-tenant/ownership');
const { teacherAssignments, teacherSectionsSql } = require('../../middleware/teacherScope');

router.use(authenticate);

// GET /simulations is a read-only, org-scoped resource catalog (no answer
// keys, no PII) — students legitimately browse it (/student/simulations).
// Must be registered BEFORE the staff-only gate below, since Express only
// applies router.use() middleware to routes matched after it.
router.get('/simulations', async (req, res) => {
  try {
    const { subject, chapter_id, source, q } = req.query;
    const where = ['(is_global=1 OR org_id=?)', 'is_active=1'];
    const params = [req.user.org_id];
    if (subject) { where.push('subject=?'); params.push(subject); }
    if (chapter_id) { where.push('chapter_id=?'); params.push(chapter_id); }
    if (source) { where.push('source=?'); params.push(source); }
    if (q) { where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    const data = await query(
      `SELECT * FROM client_simulations WHERE ${where.join(' AND ')} ORDER BY subject, title LIMIT 100`,
      params
    );
    return success(res, { simulations: data });
  } catch (err) {
    return error(res, err.message);
  }
});

// Teaching tools (sessions, decks, simulations authoring, question-bank picker)
// are staff/teacher tools — never a student/parent surface. The QB picker in
// particular returns correct_answer + solution, so an ungated router leaked
// answer keys to any authenticated student. Gate the rest of the router to
// teaching staff (GET /simulations above is deliberately exempted).
router.use(requireRole('owner','admin','principal','coordinator','hod','teacher','super_admin','system_admin'));

// Create a new session
router.post('/sessions', async (req, res) => {
  try {
    const b = req.body || {};
    const nv = (v) => (v === undefined || v === '' || v === null) ? null : v;
    const data = await teachingService.createSession({
      orgId: req.user.org_id,
      teacherId: req.user.user_id,
      classId: nv(b.classId),
      sectionId: nv(b.sectionId),
      subjectId: nv(b.subjectId),
      chapterId: nv(b.chapterId),
      topicId: nv(b.topicId),
      subtopicId: nv(b.subtopicId),
      title: b.title,
    });
    return success(res, data, 'Session created');
  } catch (err) {
    logger.error('Create session error:', err);
    return error(res, err.message);
  }
});

// List sessions (teacher's own, or all for admin)
router.get('/sessions', async (req, res) => {
  try {
    const { status, teacher_id, limit } = req.query;
    const teacherId = req.user.role_slug === 'teacher' ? req.user.user_id : (teacher_id || null);
    const data = await teachingService.listSessions({
      orgId: req.user.org_id, teacherId, status, limit,
    });
    return success(res, { sessions: data });
  } catch (err) {
    return error(res, err.message);
  }
});

// Get one session
router.get('/sessions/:id', async (req, res) => {
  try {
    const data = await teachingService.getSession(req.params.id, req.user.org_id);
    if (!data) return error(res, 'Session not found', 404);
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
});

// Start a session (sets status=live)
router.post('/sessions/:id/start', async (req, res) => {
  try {
    await teachingService.startSession(req.params.id, req.user.org_id);
    return success(res, {}, 'Session started');
  } catch (err) {
    return error(res, err.message);
  }
});

// End a session
router.post('/sessions/:id/end', async (req, res) => {
  try {
    await teachingService.endSession(req.params.id, req.user.org_id);
    return success(res, {}, 'Session ended');
  } catch (err) {
    return error(res, err.message);
  }
});

// Session report (for post-class)
router.get('/sessions/:id/report', async (req, res) => {
  try {
    const data = await teachingService.getSessionReport(req.params.id, req.user.org_id);
    if (!data) return error(res, 'Session not found', 404);
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
});

// ─── Canvas ───
router.post('/sessions/:id/canvas', async (req, res) => {
  try {
    const { canvasJson, backgroundType, pageNumber } = req.body;
    const data = await teachingService.saveCanvas({
      sessionId: req.params.id,
      orgId: req.user.org_id,
      canvasJson, backgroundType, pageNumber,
    });
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
});

router.get('/sessions/:id/canvas', async (req, res) => {
  try {
    const data = await teachingService.getCanvas(req.params.id, req.user.org_id);
    return success(res, { pages: data });
  } catch (err) {
    return error(res, err.message);
  }
});

// ─── Live Quizzes ───
router.post('/sessions/:id/quiz', async (req, res) => {
  try {
    const { questionId, questionText, questionType, options, correctAnswer, explanation, timeLimit } = req.body;
    const data = await teachingService.createLiveQuiz({
      sessionId: req.params.id,
      orgId: req.user.org_id,
      questionId, questionText, questionType, options, correctAnswer, explanation, timeLimit,
    });
    return success(res, data, 'Quiz created');
  } catch (err) {
    return error(res, err.message);
  }
});

router.post('/quiz/:quizId/launch', async (req, res) => {
  try {
    const data = await teachingService.launchQuiz(req.params.quizId, req.user.org_id);
    return success(res, data, 'Quiz launched');
  } catch (err) {
    return error(res, err.message);
  }
});

router.get('/quiz/:quizId/stats', async (req, res) => {
  try {
    const data = await teachingService.getQuizStats(req.params.quizId, req.user.org_id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
});

// ─── Activities ───
router.post('/sessions/:id/activity', async (req, res) => {
  try {
    const { activityType, config } = req.body;
    const data = await teachingService.createActivity({
      sessionId: req.params.id,
      orgId: req.user.org_id,
      activityType, config,
    });
    return success(res, data, 'Activity created');
  } catch (err) {
    return error(res, err.message);
  }
});

// ─── Simulations (write side — GET is registered above, before the gate) ───
router.post('/simulations', async (req, res) => {
  try {
    const { title, subject, chapterId, topicId, source, embedUrl, description, tags } = req.body;
    const result = await query(
      `INSERT INTO client_simulations (org_id, title, subject, chapter_id, topic_id, source, embed_url, description, tags, created_by, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,1)`,
      [req.user.org_id, title, subject, chapterId || null, topicId || null, source || 'custom', embedUrl, description || '', tags || '', req.user.user_id]
    );
    return success(res, { id: result.insertId }, 'Simulation added');
  } catch (err) {
    return error(res, err.message);
  }
});

// ─── Slide Decks ───
router.post('/decks', async (req, res) => {
  try {
    const { title, description, subjectId, chapterId, topicId, subtopicId } = req.body;
    const result = await query(
      `INSERT INTO client_slide_decks (org_id, teacher_id, subject_id, chapter_id, topic_id, subtopic_id, title, description)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.org_id, req.user.user_id, subjectId || null, chapterId || null, topicId || null, subtopicId || null, title, description || '']
    );
    return success(res, { id: result.insertId }, 'Deck created');
  } catch (err) {
    return error(res, err.message);
  }
});

router.get('/decks', async (req, res) => {
  try {
    const teacherId = req.user.role_slug === 'teacher' ? req.user.user_id : null;
    const where = ['org_id=?'];
    const params = [req.user.org_id];
    if (teacherId) { where.push('teacher_id=?'); params.push(teacherId); }
    const data = await query(
      `SELECT d.*, (SELECT COUNT(*) FROM client_slides WHERE deck_id=d.id) slide_count
       FROM client_slide_decks d
       WHERE ${where.join(' AND ')}
       ORDER BY d.updated_at DESC LIMIT 100`,
      params
    );
    return success(res, { decks: data });
  } catch (err) {
    return error(res, err.message);
  }
});

router.get('/decks/:id', async (req, res) => {
  try {
    const [deck] = await query('SELECT * FROM client_slide_decks WHERE id=? AND org_id=?', [req.params.id, req.user.org_id]);
    if (!deck) return error(res, 'Deck not found', 404);
    const slides = await query('SELECT * FROM client_slides WHERE deck_id=? ORDER BY slide_number', [req.params.id]);
    return success(res, { deck, slides });
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

router.post('/decks/:id/slides', async (req, res) => {
  try {
    await assertOrgOwns('deck', req.params.id, req.user.org_id);
    const { slideType, content, notes, slideNumber } = req.body;
    let num = slideNumber;
    if (!num) {
      const [[max]] = await Promise.all([query('SELECT MAX(slide_number) m FROM client_slides WHERE deck_id=?', [req.params.id])]);
      num = (max.m || 0) + 1;
    }
    const result = await query(
      `INSERT INTO client_slides (deck_id, slide_number, slide_type, content_json, notes)
       VALUES (?,?,?,?,?)`,
      [req.params.id, num, slideType || 'concept', JSON.stringify(content || {}), notes || '']
    );
    await query('UPDATE client_slide_decks SET slide_count=(SELECT COUNT(*) FROM client_slides WHERE deck_id=?) WHERE id=? AND org_id=?', [req.params.id, req.params.id, req.user.org_id]);
    return success(res, { id: result.insertId, slide_number: num }, 'Slide added');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

router.put('/slides/:id', async (req, res) => {
  try {
    await assertOrgOwns('slide', req.params.id, req.user.org_id);
    const { content, notes, slideType } = req.body;
    await query(
      'UPDATE client_slides SET content_json=?, notes=?, slide_type=COALESCE(?, slide_type) WHERE id=?',
      [JSON.stringify(content || {}), notes || '', slideType || null, req.params.id]
    );
    return success(res, {}, 'Slide updated');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

router.delete('/slides/:id', async (req, res) => {
  try {
    await assertOrgOwns('slide', req.params.id, req.user.org_id);
    await query('DELETE FROM client_slides WHERE id=?', [req.params.id]);
    return success(res, {}, 'Slide deleted');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

module.exports = router;

// ═══ DROPDOWN CASCADE HELPERS ═══

// Get classes (org-scoped)
router.get('/classes', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, name, standard FROM client_classes WHERE org_id=? AND status='active' ORDER BY COALESCE(display_order, standard*10), standard, name`,
      [req.user.org_id]
    );
    return success(res, { classes: rows });
  } catch (err) { return error(res, err.message); }
});

// Teacher self-service: what am I responsible for?
//
// These two were written against client_teachers / client_section_teachers —
// neither of which this platform has ever had. Every call threw "table doesn't
// exist", and the catch turned that into `{status:'success', data:[]}`, so the
// endpoints reported a healthy empty roster forever. Both now resolve through
// the one teacher scope (timetable ∪ subject assignments ∪ class teacher), and
// a real failure is reported as a failure. — JDPS P-0, 2026-07-29
router.get('/my-classes', async (req, res) => {
  try {
    const rows = await teacherAssignments(req.user.org_id, req.user.user_id);
    return success(res, { classes: rows });
  } catch (err) { return error(res, err.message, 500); }
});

router.get('/my-students', async (req, res) => {
  try {
    const { sql, params } = teacherSectionsSql(req.user.org_id, req.user.user_id);
    const rows = await query(
      // Every ORDER BY column is in the SELECT list on purpose: with DISTINCT,
      // ordering by a column that is not selected is an error under ONLY_FULL_GROUP_BY
      // (it 500'd until the harness drove this route for real).
      `SELECT DISTINCT s.id, s.admission_number,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as full_name,
              u.email, sec.name as section_name, c.name as class_name,
              c.standard, u.first_name, u.last_name
         FROM client_enrollments e
         JOIN client_students s ON s.id = e.student_id
         LEFT JOIN client_users u ON u.id = s.user_id
         LEFT JOIN client_sections sec ON sec.id = e.section_id
         LEFT JOIN client_classes c ON c.id = sec.class_id
        WHERE e.org_id = ? AND e.status = 'active'
          AND e.section_id IN (${sql})
        ORDER BY COALESCE(c.display_order, c.standard*10), c.standard, sec.name, u.first_name, u.last_name
        LIMIT 200`,
      [req.user.org_id, ...params]
    );
    return success(res, { students: rows });
  } catch (err) { return error(res, err.message, 500); }
});


// Sections for a class
router.get('/classes/:id/sections', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, name FROM client_sections WHERE org_id=? AND class_id=? AND status='active' ORDER BY name`,
      [req.user.org_id, req.params.id]
    );
    return success(res, { sections: rows });
  } catch (err) { return error(res, err.message); }
});

// Subjects (org-scoped; for teachers show all subjects in org — simpler & reliable)
router.get('/subjects', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, name, color FROM client_subjects WHERE org_id=? AND status='active' ORDER BY COALESCE(display_order, 900), name`,
      [req.user.org_id]
    );
    return success(res, { subjects: rows });
  } catch (err) { return error(res, err.message); }
});

// Chapters for a subject
router.get('/subjects/:id/chapters', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, name, target_class FROM client_qb_chapters 
       WHERE org_id=? AND subject_id=? AND is_active=1 
       ORDER BY sort_order, name`,
      [req.user.org_id, req.params.id]
    );
    return success(res, { chapters: rows });
  } catch (err) { return error(res, err.message); }
});

// Topics for a chapter
router.get('/chapters/:id/topics', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, name FROM client_qb_topics 
       WHERE org_id=? AND chapter_id=? AND is_active=1 
       ORDER BY sort_order, name`,
      [req.user.org_id, req.params.id]
    );
    return success(res, { topics: rows });
  } catch (err) { return error(res, err.message); }
});

// QB questions picker (for quiz panel — filtered by current session context)
router.get('/qb/pick', async (req, res) => {
  try {
    const { subject_id, chapter_id, topic_id, difficulty, question_type, q, limit = 30 } = req.query;
    const where = ['org_id=?', 'is_active=1'];
    const params = [req.user.org_id];
    if (subject_id) { where.push('subject_id=?'); params.push(subject_id); }
    if (chapter_id) { where.push('chapter_id=?'); params.push(chapter_id); }
    if (topic_id) { where.push('topic_id=?'); params.push(topic_id); }
    if (difficulty) { where.push('difficulty=?'); params.push(difficulty); }
    if (question_type) { where.push('question_type=?'); params.push(question_type); }
    else { where.push(`question_type IN ('mcq_single','mcq_multi','integer')`); }
    if (q) { where.push('question_text LIKE ?'); params.push(`%${q}%`); }
    params.push(Number(limit));
    const rows = await query(
      `SELECT id, question_text, question_type, options, correct_answer, solution, 
              difficulty, has_latex, marks_positive
       FROM client_qb_questions 
       WHERE ${where.join(' AND ')}
       ORDER BY times_used ASC, id DESC 
       LIMIT ?`,
      params
    );
    return success(res, { questions: rows });
  } catch (err) { return error(res, err.message); }
});

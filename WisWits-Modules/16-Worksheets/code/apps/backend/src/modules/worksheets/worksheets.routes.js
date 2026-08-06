const express = require('express');
const router  = express.Router();
const { query, queryOne, transaction } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const logger = require('../../utils/logger');
const ws = require('../../services/worksheetService');
const { checkTitle } = require('../../utils/validate');

// Token-in-query pre-auth (for ?token= on /render)
router.use((req, res, next) => {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});

router.use(authenticate);

// ═══════════════════════════════════════════════════════════════════════════
// CURATED WORKSHEETS (SUG-0052) — the school's PDF worksheet library.
// Files live OUTSIDE any public web root and are served only through the
// authenticated stream below ("secure display": inline, no-store, and the
// direct filesystem path never leaves the server).
// ═══════════════════════════════════════════════════════════════════════════
const multer = require('multer');
const pathC = require('path');
const fsC = require('fs');
const CURATED_DIR = process.env.CURATED_WS_DIR || '/var/www/wiswits/uploads/curated-worksheets';
try { if (!fsC.existsSync(CURATED_DIR)) fsC.mkdirSync(CURATED_DIR, { recursive: true }); } catch (e) { logger.warn('curated dir:', e.message); }

const curatedStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CURATED_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    cb(null, `${req.user.org_id}_${Date.now()}_${safe}`);
  },
});
const curatedUpload = multer({
  storage: curatedStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed'));
  },
});

const ELEVATED_WS = ['owner','admin','principal','coordinator','hod','super_admin','system_admin'];

// Upload a curated PDF (teacher/staff)
router.post('/curated', requirePermission('worksheets.create'), (req, res) => {
  curatedUpload.single('file')(req, res, async (err) => {
    if (err) return error(res, err.message, 400);
    try {
      if (!req.file) return error(res, 'PDF file required', 400);
      const { title, class_name, subject, description } = req.body;
      // QA r6 BUG 2: reject meaningless titles (e.g. "j") server-side.
      const tc = checkTitle(title, 'Worksheet title');
      if (!tc.ok) return error(res, tc.message, 400);
      // Platform rule (SUG-0053): a WisWits/superadmin upload is 'platform' —
      // assigned to this school, viewable but never editable/deletable by it.
      const PLATFORM_ROLES = ['owner','super_admin','system_admin'];
      const source = PLATFORM_ROLES.includes((req.user.role_slug || '').toLowerCase()) ? 'platform' : 'school';
      const r = await query(
        `INSERT INTO client_curated_worksheets (org_id, title, class_name, subject, description, file_path, file_size, uploaded_by, source)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [req.user.org_id, tc.value, class_name || null, subject || null,
         description || null, req.file.path, req.file.size, req.user.user_id, source]);
      return success(res, { id: r.insertId }, 'Worksheet uploaded', 201);
    } catch (e) { return error(res, e.message, 500); }
  });
});

// List curated worksheets (any authenticated role — students may practice too)
router.get('/curated', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { class_name, subject } = req.query;
    let where = 'c.org_id=?'; const p = [o];
    if (class_name) { where += ' AND c.class_name=?'; p.push(class_name); }
    if (subject) { where += ' AND c.subject=?'; p.push(subject); }
    const rows = await query(
      `SELECT c.id, c.title, c.class_name, c.subject, c.description, c.file_size,
              c.created_at, c.uploaded_by, c.source,
              CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS uploaded_by_name
         FROM client_curated_worksheets c
         LEFT JOIN client_users u ON u.id=c.uploaded_by
        WHERE ${where}
        ORDER BY c.class_name, c.subject, c.created_at DESC LIMIT 500`, p);
    return success(res, { worksheets: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// Secure inline stream (auth via header or ?token=, same as /render)
router.get('/curated/:id/file', async (req, res) => {
  try {
    const w = await queryOne('SELECT * FROM client_curated_worksheets WHERE id=? AND org_id=?', [req.params.id, req.user.org_id]);
    if (!w) return res.status(404).send('Not found');
    if (!fsC.existsSync(w.file_path)) return res.status(404).send('File missing');
    // Helmet sets X-Frame-Options: SAMEORIGIN globally, which blocks the app's
    // (cross-origin) secure viewer iframe — "api.wiswits.com refused to connect".
    // This endpoint is already auth-gated, so allow framing from the app only.
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy',
      "frame-ancestors 'self' https://app.wiswits.com http://localhost:3000");
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(w.title)}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return fsC.createReadStream(w.file_path).pipe(res);
  } catch (e) { return error(res, 'Failed to open worksheet', 500, e.message); }
});

// Delete a curated worksheet.
// Platform rows ('platform' source) — ONLY WisWits/superadmin may delete;
// school rows — uploader or school-elevated staff.
router.delete('/curated/:id', requirePermission('worksheets.create'), async (req, res) => {
  try {
    const w = await queryOne('SELECT uploaded_by, file_path, source FROM client_curated_worksheets WHERE id=? AND org_id=?', [req.params.id, req.user.org_id]);
    if (!w) return error(res, 'Not found', 404);
    const role = (req.user.role_slug || '').toLowerCase();
    if (w.source === 'platform' && !['owner','super_admin','system_admin'].includes(role)) {
      return error(res, 'This worksheet is provided by WisWits and cannot be deleted by the school', 403);
    }
    const elevated = ELEVATED_WS.includes(role);
    if (w.source !== 'platform' && !elevated && w.uploaded_by !== req.user.user_id) return error(res, 'You can only delete worksheets you uploaded', 403);
    await query('DELETE FROM client_curated_worksheets WHERE id=? AND org_id=?', [req.params.id, req.user.org_id]);
    try { fsC.unlinkSync(w.file_path); } catch {}
    return success(res, {}, 'Deleted');
  } catch (e) { return error(res, e.message, 500); }
});

// ─── List worksheets ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const o = req.user.org_id;
    const rows = await query(
      `SELECT w.*,
        s.name AS subject_name, s.color AS subject_color,
        CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS created_by_name
       FROM client_worksheets w
       LEFT JOIN client_qb_subjects s ON s.id=w.subject_id
       LEFT JOIN client_users u ON u.id=w.created_by
       WHERE w.org_id=?
       ORDER BY w.created_at DESC LIMIT 50`,
      [o]
    );
    return success(res, { worksheets: rows });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Preview auto-picked questions (before saving) ─────────────────────────
router.post('/preview', requirePermission('worksheets.create'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { subject_id, chapter_ids, topic_ids, target_class, exam_tag, easy_count, medium_count, hard_count, question_types } = req.body;

    const picked = await ws.pickQuestions(o, {
      subject_id, chapter_ids, topic_ids, target_class, exam_tag,
      easy_count: parseInt(easy_count)||0,
      medium_count: parseInt(medium_count)||0,
      hard_count: parseInt(hard_count)||0,
      question_types,
    });

    if (picked.ids.length === 0) {
      return success(res, { ids: [], questions: [], shortfall: true }, 'No questions matched criteria');
    }

    const questions = await ws.fetchQuestions(o, picked.ids);

    return success(res, {
      ids: picked.ids,
      questions,
      easy_picked: picked.easy.length,
      medium_picked: picked.medium.length,
      hard_picked: picked.hard.length,
      requested: {
        easy: parseInt(easy_count)||0,
        medium: parseInt(medium_count)||0,
        hard: parseInt(hard_count)||0,
      },
      shortfall: (picked.easy.length < (parseInt(easy_count)||0)) ||
                 (picked.medium.length < (parseInt(medium_count)||0)) ||
                 (picked.hard.length < (parseInt(hard_count)||0)),
    });
  } catch(e) { logger.error('WS preview:', e); return error(res, e.message, 500); }
});

// ─── Swap a question ───────────────────────────────────────────────────────
router.post('/swap-question', requirePermission('worksheets.create'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { current_id, subject_id, chapter_ids, difficulty, exclude_ids } = req.body;
    
    const picked = await ws.pickQuestions(o, {
      subject_id,
      chapter_ids,
      [difficulty==='easy'?'easy_count':difficulty==='hard'?'hard_count':'medium_count']: 1,
      exclude_ids: exclude_ids || [current_id],
    });

    if (picked.ids.length === 0) return error(res, 'No alternate question available', 404);
    const questions = await ws.fetchQuestions(o, picked.ids);
    return success(res, { question: questions[0] });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Create / save worksheet ───────────────────────────────────────────────
router.post('/', requirePermission('worksheets.create'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const {
      title: rawTitle, description, instructions,
      subject_id, chapter_ids, topic_ids, target_class, exam_tag,
      easy_count, medium_count, hard_count,
      template_key, brand_color, header_text, footer_text,
      duration_minutes, question_ids, status,
    } = req.body;

    // QA r6 BUG 2: server-side title guard (min length, trimmed, not blank).
    const tc = checkTitle(rawTitle, 'Worksheet title');
    if (!tc.ok) return error(res, tc.message, 400);
    const title = tc.value;
    if (!Array.isArray(question_ids) || question_ids.length === 0) return error(res, 'question_ids[] required', 400);

    // Calculate total marks from selected questions
    const placeholders = question_ids.map(()=>'?').join(',');
    const marksRow = await queryOne(
      `SELECT SUM(marks_positive) AS total FROM client_qb_questions WHERE id IN (${placeholders}) AND org_id=?`,
      [...question_ids, o]
    );

    const r = await query(
      `INSERT INTO client_worksheets (
        org_id, title, description, instructions,
        subject_id, chapter_ids, topic_ids, target_class, exam_tag,
        easy_count, medium_count, hard_count,
        template_key, brand_color, header_text, footer_text,
        duration_minutes, total_marks, question_ids, question_count,
        status, created_by
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        o, title, description||null, instructions||null,
        subject_id||null,
        Array.isArray(chapter_ids) ? chapter_ids.join(',') : null,
        Array.isArray(topic_ids) ? topic_ids.join(',') : null,
        target_class||null, exam_tag||null,
        parseInt(easy_count)||0, parseInt(medium_count)||0, parseInt(hard_count)||0,
        template_key||'classic', brand_color||'#2563eb', header_text||null, footer_text||null,
        duration_minutes||null, marksRow?.total||0,
        question_ids.join(','), question_ids.length,
        status||'draft', req.user.user_id
      ]
    );
    return success(res, { id: r.insertId }, 'Worksheet saved', 201);
  } catch(e) { logger.error('WS create:', e); return error(res, e.message, 500); }
});

// ─── Get single worksheet with full questions ──────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const w = await queryOne(
      `SELECT w.*, s.name AS subject_name
       FROM client_worksheets w
       LEFT JOIN client_qb_subjects s ON s.id=w.subject_id
       WHERE w.id=? AND w.org_id=?`,
      [req.params.id, o]
    );
    if (!w) return error(res, 'Not found', 404);

    const ids = (w.question_ids || '').split(',').map(s=>parseInt(s.trim())).filter(Boolean);
    let questions = await ws.fetchQuestions(o, ids);

    // Students/parents must NEVER receive the answer key on this JSON endpoint
    // (mirrors the /render student-version gate).
    if (['student', 'parent'].includes(req.user.role_slug)) {
      questions = questions.map((q) => {
        const { correct_answer, solution, explanation, answer, ...rest } = q;
        return rest;
      });
    }

    return success(res, { worksheet: w, questions });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Render HTML (student or teacher version) ─────────────────────────────
// Allow token via ?token= query for direct-link PDF render (student/parent clicking Student PDF / Teacher PDF)
const jwtLib = require('jsonwebtoken');
const queryTokenAuth = (req, res, next) => {
  if (req.user) return next();
  const token = req.query.token;
  if (!token) return res.status(401).send('Unauthorized');
  try {
    const decoded = jwtLib.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch { return res.status(401).send('Invalid token'); }
};
// query-token
router.get('/:id/render', queryTokenAuth, async (req, res) => {
  try {
    const o = req.user.org_id;
    // Only staff/teacher may view the teacher (answer-key) version. Students/parents
    // are forced to the student version regardless of the ?version= query param.
    const isStudentOrParent = ['student', 'parent'].includes(req.user.role_slug);
    const withSolutions = req.query.version === 'teacher' && !isStudentOrParent;

    const w = await queryOne('SELECT * FROM client_worksheets WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!w) return res.status(404).send('Not found');

    const ids = (w.question_ids || '').split(',').map(s=>parseInt(s.trim())).filter(Boolean);
    const questions = await ws.fetchQuestions(o, ids);
    const html = await ws.renderHtml(o, w, questions, { withSolutions });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch(e) { return error(res, 'Failed to render worksheet', 500, e.message); }
});

// ─── Assign as homework ────────────────────────────────────────────────────
router.post('/:id/assign-as-homework', requirePermission('worksheets.create'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { section_id, due_date } = req.body;
    if (!section_id || !due_date) return error(res, 'section_id and due_date required', 400);

    const w = await queryOne('SELECT * FROM client_worksheets WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!w) return error(res, 'Worksheet not found', 404);

    const attachmentUrl = `/api/worksheets/${w.id}/render?version=student`;

    // Two writes must be atomic: a partial failure would otherwise leave an
    // assignment with the worksheet still unmarked (or vice-versa).
    const assignmentId = await transaction(async (conn) => {
      const [assignR] = await conn.execute(
        `INSERT INTO client_assignments
          (org_id, teacher_id, section_id, title, instructions, attachment_url, max_marks, due_date, status, allow_late)
         VALUES (?,?,?,?,?,?,?,?, 'published', 1)`,
        [o, req.user.user_id, section_id, w.title,
         `Worksheet: ${w.title}\n${w.instructions||''}\nView: ${attachmentUrl}`,
         attachmentUrl, w.total_marks || w.question_count, due_date]
      );
      await conn.execute(
        'UPDATE client_worksheets SET status="assigned", section_id=?, assignment_id=?, assigned_to_section=1 WHERE id=?',
        [section_id, assignR.insertId, w.id]
      );
      return assignR.insertId;
    });

    return success(res, { assignment_id: assignmentId, worksheet_id: w.id }, 'Worksheet assigned as homework', 201);
  } catch(e) { logger.error('WS assign:', e); return error(res, e.message, 500); }
});

// ─── Delete ────────────────────────────────────────────────────────────────
router.delete('/:id', requirePermission('worksheets.create'), async (req, res) => {
  try {
    const o = req.user.org_id;
    await query('DELETE FROM client_worksheets WHERE id=? AND org_id=?', [req.params.id, o]);
    return success(res, {}, 'Worksheet deleted');
  } catch(e) { return error(res, e.message, 500); }
});

module.exports = router;

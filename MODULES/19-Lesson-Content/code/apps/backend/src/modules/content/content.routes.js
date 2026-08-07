const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireModule }   = require('../../middleware/moduleGate');
const { requireRole } = require('../../middleware/rbac');
const logger = require('../../utils/logger');
const notifSvc = require('../../services/notificationService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Uploaded content files (PDF/DOC/PPT/images) live OUTSIDE the web root and are
// served only through the authenticated, org-scoped /file route below — never
// via the public /uploads mount. Keeps curriculum content non-downloadable.
const CONTENT_DIR = process.env.CONTENT_DIR || '/var/www/wiswits/uploads/content';
try { fs.mkdirSync(CONTENT_DIR, { recursive: true }); } catch (e) { /* created on boot */ }
const ALLOWED_MIME = new Set([
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png', 'image/jpeg', 'image/webp',
]);
const contentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, CONTENT_DIR),
    filename: (req, file, cb) => {
      const safe = (file.originalname || 'file').replace(/[^\w.-]/g, '_').slice(-80);
      cb(null, `${req.user.org_id}_${Date.now()}_${safe}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ALLOWED_MIME.has(file.mimetype)),
});

router.use(authenticate);

// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('courses'));
// ─── FILE UPLOAD (PDF/DOC/PPT/image) → secure, auth-only URL ───────────────
router.post('/upload', requireRole('owner', 'admin', 'principal', 'teacher'), contentUpload.single('file'), (req, res) => {
  if (!req.file) return error(res, 'Upload a PDF, DOC, PPT or image (≤25MB)', 400);
  return success(res, { url: `/api/content/file/${req.file.filename}`, filename: req.file.filename }, 'Uploaded', 201);
});

// Stream a content file — auth required; a file is scoped to its org by the
// filename prefix, so one tenant can never read another's uploads.
router.get('/file/:name', (req, res) => {
  const name = path.basename(req.params.name);
  if (!name.startsWith(`${req.user.org_id}_`)) return error(res, 'Forbidden', 403);
  const fp = path.join(CONTENT_DIR, name);
  if (!fs.existsSync(fp)) return error(res, 'Not found', 404);
  const ext = path.extname(name).toLowerCase();
  const mime = ext === '.pdf' ? 'application/pdf'
    : ext === '.png' ? 'image/png'
    : (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg'
    : ext === '.webp' ? 'image/webp' : 'application/octet-stream';
  res.setHeader('Content-Type', mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try { res.removeHeader('X-Frame-Options'); } catch (e) {}
  fs.createReadStream(fp).on('error', () => { try { res.status(500).end(); } catch (e) {} }).pipe(res);
});

// ─── STATS ────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const o = req.user.org_id;
    const row = await queryOne(
      `SELECT
        COUNT(*) AS total,
        SUM(status='published') AS published,
        SUM(type='video' OR type='youtube' OR type='recorded_class') AS videos,
        SUM(type='pdf' OR type='doc') AS documents,
        SUM(views_count) AS total_views
       FROM client_content_items WHERE org_id=?`,
      [o]
    );
    return success(res, row);
  } catch(e) { return error(res, e.message, 500); }
});

// ─── LIST (with filters) ──────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { subject_id, section_id, class_id, type, chapter, search, limit = 100 } = req.query;

    let where = 'WHERE c.org_id=? AND c.status=?';
    const params = [o, 'published'];
    if (subject_id) { where += ' AND c.subject_id=?'; params.push(subject_id); }
    if (section_id) { where += ' AND c.section_id=?'; params.push(section_id); }
    if (class_id)   { where += ' AND c.class_id=?';   params.push(class_id); }
    if (type)       { where += ' AND c.type=?';       params.push(type); }
    if (chapter)    { where += ' AND c.chapter=?';    params.push(chapter); }
    if (search)     {
      where += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.topic LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const rows = await query(
      `SELECT c.*,
        s.name AS subject_name, s.color AS subject_color,
        sec.name AS section_name, cl.name AS class_name,
        CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS uploader_name
       FROM client_content_items c
       LEFT JOIN client_subjects s ON s.id=c.subject_id
       LEFT JOIN client_sections sec ON sec.id=c.section_id
       LEFT JOIN client_classes cl ON cl.id=c.class_id
       LEFT JOIN client_users u ON u.id=c.uploaded_by
       ${where}
       ORDER BY c.published_at DESC
       LIMIT ?`,
      [...params, parseInt(limit)]
    );
    return success(res, { content: rows });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Teacher's own uploads ────────────────────────────────────────────────
router.get('/teacher/mine', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const rows = await query(
      `SELECT c.*, s.name AS subject_name, s.color AS subject_color,
        sec.name AS section_name, cl.name AS class_name
       FROM client_content_items c
       LEFT JOIN client_subjects s ON s.id=c.subject_id
       LEFT JOIN client_sections sec ON sec.id=c.section_id
       LEFT JOIN client_classes cl ON cl.id=c.class_id
       WHERE c.org_id=? AND c.uploaded_by=?
       ORDER BY c.created_at DESC`,
      [o, uid]
    );
    return success(res, { content: rows });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Student library (only content for their section) ────────────────────
router.get('/student/library', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;

    const student = await queryOne(
      'SELECT id FROM client_students WHERE user_id=? AND org_id=?', [uid, o]
    );
    if (!student) return error(res, 'Student not found', 404);

    const enrollment = await queryOne(
      `SELECT section_id, sec.class_id FROM client_enrollments e
       JOIN client_sections sec ON sec.id=e.section_id
       WHERE e.student_id=? AND e.status='active' AND e.org_id=?`,
      [student.id, o]
    );

    let where = 'WHERE c.org_id=? AND c.status=?';
    const params = [o, 'published'];
    if (enrollment) {
      where += ' AND (c.section_id=? OR c.class_id=? OR (c.section_id IS NULL AND c.class_id IS NULL))';
      params.push(enrollment.section_id, enrollment.class_id);
    }

    const content = await query(
      `SELECT c.*,
        s.name AS subject_name, s.color AS subject_color,
        CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS uploader_name,
        p.watched_seconds, p.completion_pct, p.completed
       FROM client_content_items c
       LEFT JOIN client_subjects s ON s.id=c.subject_id
       LEFT JOIN client_users u ON u.id=c.uploaded_by
       LEFT JOIN client_content_progress p ON p.content_id=c.id AND p.student_id=?
       ${where}
       ORDER BY c.published_at DESC`,
      [student.id, ...params]
    );

    // Continue watching
    const continueWatching = content.filter(c =>
      c.watched_seconds > 0 && !c.completed && (c.completion_pct || 0) < 95
    ).slice(0, 5);

    // Group by subject
    const bySubject = {};
    content.forEach(c => {
      const key = c.subject_name || 'General';
      if (!bySubject[key]) bySubject[key] = [];
      bySubject[key].push(c);
    });

    return success(res, {
      content, continueWatching, bySubject,
      total: content.length,
      watched: content.filter(c => c.completed).length,
    });
  } catch(e) { logger.error('Student library:', e); return error(res, e.message, 500); }
});

// ─── Parent view: children's learning progress ────────────────────────────
router.get('/parent/children-progress', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;

    const parent = await queryOne('SELECT id FROM client_parents WHERE user_id=? AND org_id=?', [uid, o]);
    if (!parent) return error(res, 'Parent not found', 404);

    const children = await query(
      `SELECT cs.id AS student_id, u.first_name, u.last_name,
        e.section_id, sec.name AS section_name, cl.name AS class_name
       FROM client_parent_students ps
       JOIN client_students cs ON cs.id=ps.student_id
       JOIN client_users u ON u.id=cs.user_id
       LEFT JOIN client_enrollments e ON e.student_id=cs.id AND e.status='active'
       LEFT JOIN client_sections sec ON sec.id=e.section_id
       LEFT JOIN client_classes cl ON cl.id=sec.class_id
       WHERE ps.parent_id=? AND ps.org_id=? AND COALESCE(ps.status,'active')='active'`,
      [parent.id, o]
    );

    for (const child of children) {
      const stats = await queryOne(
        `SELECT
          COUNT(DISTINCT c.id) AS total_available,
          COUNT(DISTINCT p.content_id) AS started,
          SUM(p.completed) AS completed,
          ROUND(AVG(p.completion_pct),1) AS avg_completion
         FROM client_content_items c
         LEFT JOIN client_content_progress p ON p.content_id=c.id AND p.student_id=?
         WHERE c.org_id=? AND c.status='published'
           AND (c.section_id=? OR (c.section_id IS NULL AND c.class_id IS NULL))`,
        [child.student_id, o, child.section_id]
      );
      child.progress = stats;

      // Recent activity
      const recent = await query(
        `SELECT c.id AS content_id, c.title, c.type, c.content_url, c.thumbnail_url,
          s.name AS subject_name, s.color AS subject_color,
          p.watched_seconds, p.completion_pct, p.last_watched_at
         FROM client_content_progress p
         JOIN client_content_items c ON c.id=p.content_id
         LEFT JOIN client_subjects s ON s.id=c.subject_id
         WHERE p.student_id=? AND p.org_id=?
         ORDER BY p.last_watched_at DESC LIMIT 5`,
        [child.student_id, o]
      );
      child.recent = recent;
    }

    return success(res, { children });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Single content detail + increment views ─────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const item = await queryOne(
      `SELECT c.*,
        s.name AS subject_name, s.color AS subject_color,
        sec.name AS section_name, cl.name AS class_name,
        CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS uploader_name
       FROM client_content_items c
       LEFT JOIN client_subjects s ON s.id=c.subject_id
       LEFT JOIN client_sections sec ON sec.id=c.section_id
       LEFT JOIN client_classes cl ON cl.id=c.class_id
       LEFT JOIN client_users u ON u.id=c.uploaded_by
       WHERE c.id=? AND c.org_id=?`,
      [req.params.id, o]
    );
    if (!item) return error(res, 'Content not found', 404);

    // Increment views (async, don't await)
    query('UPDATE client_content_items SET views_count=views_count+1 WHERE id=?', [req.params.id]).catch(()=>{});

    // Student progress if student
    let progress = null;
    const student = await queryOne('SELECT id FROM client_students WHERE user_id=? AND org_id=?', [req.user.user_id, o]);
    if (student) {
      progress = await queryOne(
        'SELECT * FROM client_content_progress WHERE content_id=? AND student_id=?',
        [req.params.id, student.id]
      );
    }

    return success(res, { item, progress });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── CREATE content ───────────────────────────────────────────────────────
router.post('/', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const {
      title, description, type, subject_id, class_id, section_id,
      chapter, topic, content_url, thumbnail_url, duration_secs,
      access_level, status
    } = req.body;

    if (!title || !content_url) return error(res, 'title and content_url required', 400);

    const r = await query(
      `INSERT INTO client_content_items
        (org_id, title, description, type, subject_id, class_id, section_id,
         chapter, topic, content_url, thumbnail_url, duration_secs,
         uploaded_by, access_level, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [o, title, description||null, type||'youtube',
       subject_id||null, class_id||null, section_id||null,
       chapter||null, topic||null, content_url, thumbnail_url||null,
       duration_secs||null, req.user.user_id,
       access_level||'enrolled', status||'published']
    );

    // Notify students in section
    if (section_id && (status||'published') === 'published') {
      try {
        await notifSvc.sendToSection(o, section_id, {
          type: 'content_new',
          title: `New ${type||'video'} added`,
          body: title,
          action_url: '/student/learn',
          icon: 'Video',
          priority: 'normal',
          sender_id: req.user.user_id,
          sender_role: 'teacher',
        });
        await notifSvc.sendToParentsOfSection(o, section_id, {
          type: 'content_new',
          title: `New learning material available`,
          body: title,
          action_url: '/parent/content',
          icon: 'Video',
          priority: 'low',
          sender_id: req.user.user_id,
          sender_role: 'teacher',
        });
      } catch(err) { logger.warn('Notification failed:', err); }
    }

    return success(res, { id: r.insertId }, 'Content published', 201);
  } catch(e) { logger.error('Content create:', e); return error(res, e.message, 500); }
});

// ─── UPDATE content ───────────────────────────────────────────────────────
router.put('/:id', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const o = req.user.org_id;
    // A teacher may edit only their OWN uploads (matches the DELETE guard).
    if ((req.user.role_slug || '').toLowerCase() === 'teacher') {
      const item = await queryOne('SELECT uploaded_by FROM client_content_items WHERE id=? AND org_id=?', [req.params.id, o]);
      if (!item) return error(res, 'Not found', 404);
      if (item.uploaded_by !== req.user.user_id) return error(res, 'You can only edit content you uploaded', 403);
    }
    const {
      title, description, type, subject_id, class_id, section_id,
      chapter, topic, content_url, thumbnail_url, duration_secs, status
    } = req.body;

    await query(
      `UPDATE client_content_items SET
        title=COALESCE(?,title), description=COALESCE(?,description),
        type=COALESCE(?,type),
        subject_id=COALESCE(?,subject_id), class_id=COALESCE(?,class_id), section_id=COALESCE(?,section_id),
        chapter=COALESCE(?,chapter), topic=COALESCE(?,topic),
        content_url=COALESCE(?,content_url), thumbnail_url=COALESCE(?,thumbnail_url),
        duration_secs=COALESCE(?,duration_secs), status=COALESCE(?,status)
       WHERE id=? AND org_id=?`,
      [title||null, description||null, type||null,
       subject_id||null, class_id||null, section_id||null,
       chapter||null, topic||null, content_url||null, thumbnail_url||null,
       duration_secs||null, status||null,
       req.params.id, o]
    );
    return success(res, {}, 'Content updated');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── DELETE content ───────────────────────────────────────────────────────
router.delete('/:id', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const o = req.user.org_id;
    // A teacher may delete only their OWN uploads; elevated staff can delete any.
    const role = (req.user.role_slug || '').toLowerCase();
    if (role === 'teacher') {
      const item = await queryOne('SELECT uploaded_by FROM client_content_items WHERE id=? AND org_id=?', [req.params.id, o]);
      if (!item) return error(res, 'Not found', 404);
      if (item.uploaded_by !== req.user.user_id) return error(res, 'You can only delete content you uploaded', 403);
    }
    await query('DELETE FROM client_content_progress WHERE content_id=? AND org_id=?', [req.params.id, o]);
    await query('DELETE FROM client_content_items WHERE id=? AND org_id=?', [req.params.id, o]);
    return success(res, {}, 'Deleted');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── PROGRESS tracking ────────────────────────────────────────────────────
router.put('/:id/progress', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { watched_seconds, completion_pct, completed, notes_text } = req.body;

    const student = await queryOne('SELECT id FROM client_students WHERE user_id=? AND org_id=?', [req.user.user_id, o]);
    if (!student) return error(res, 'Student only', 403);

    await query(
      `INSERT INTO client_content_progress
        (org_id, content_id, student_id, watched_seconds, completion_pct, completed, notes_text, last_watched_at)
       VALUES (?,?,?,?,?,?,?,NOW())
       ON DUPLICATE KEY UPDATE
         watched_seconds=VALUES(watched_seconds),
         completion_pct=VALUES(completion_pct),
         completed=VALUES(completed),
         notes_text=COALESCE(VALUES(notes_text), notes_text),
         last_watched_at=NOW()`,
      [o, req.params.id, student.id,
       watched_seconds||0, completion_pct||0,
       completed?1:0, notes_text||null]
    );
    return success(res, {}, 'Progress saved');
  } catch(e) { return error(res, e.message, 500); }
});

module.exports = router;

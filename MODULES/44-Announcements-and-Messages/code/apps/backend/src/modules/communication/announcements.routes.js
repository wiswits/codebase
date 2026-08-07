const express = require('express');
const router = express.Router();
const multer = require('multer');
const { validateUploads } = require('../../utils/fileMagic');
const fs = require('fs');
const path = require('path');
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');
const { audit } = require('../../utils/audit');
// ONE definition of "who receives an announcement" — see utils/announcementTargeting.js.
// Never spell the 'all' rule inline again; QA round 9 found a `["all"]` row that
// DISPLAYED as "To: All" but matched no reader query.
const {
  parseTargetRoles, normalizeTargetRoles, targetsRole,
  announcementVisibleSql, canManageAnnouncements, ALL_RECIPIENT_BASE_ROLES,
} = require('../../utils/announcementTargeting');

// Attachments upload
const uploadDir = process.env.ANNOUNCEMENTS_DIR || '/var/www/wiswits/uploads/announcements';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
// Restrict upload types — block HTML/SVG/scripts that could execute if served.
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword', 'application/vnd.ms-excel', 'text/plain'
]);
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error('File type not allowed'));
  }
});

router.use(authenticate);

// ═══════════════════════════════════════════════════════
// GET /api/announcements — list with filters + role targeting
// ═══════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const role = req.user.role_slug || req.user.role;
    const { status, category, pinned, search, mine_only, view: rawView = 'inbox' } = req.query;

    // 'manage' is the publisher's view: it deliberately skips role targeting so
    // staff can administer every notice. It must therefore be ROLE-GATED — it was
    // not, so any student could pass ?view=manage and read staff-only
    // announcements straight past the targeting rule. Non-staff always get inbox.
    const view = (rawView === 'manage' && canManageAnnouncements(role)) ? 'manage' : 'inbox';

    const where = ['a.org_id=?'];
    const params = [orgId];

    // For "inbox" view (receive), apply role targeting
    if (view === 'inbox') {
      const vis = announcementVisibleSql('a', role);
      where.push(vis.sql);
      params.push(...vis.params);
    }

    if (status) { where.push('a.status=?'); params.push(status); }
    if (category) { where.push('a.category=?'); params.push(category); }
    if (pinned === '1') where.push('a.is_pinned=1');
    if (search) { where.push('(a.title LIKE ? OR a.content LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (mine_only === '1' && userId) { where.push('a.created_by=?'); params.push(userId); }

    const rows = await query(`
      SELECT a.*,
        CONCAT(u.first_name,' ',u.last_name) AS creator_name,
        (SELECT r.slug FROM client_user_roles ur JOIN client_roles r ON r.id=ur.role_id WHERE ur.user_id=a.created_by LIMIT 1) AS creator_role,
        (SELECT read_at FROM announcement_reads WHERE announcement_id=a.id AND user_id=?) AS my_read_at
      FROM announcements a
      LEFT JOIN client_users u ON u.id=a.created_by
      WHERE ${where.join(' AND ')}
      ORDER BY a.is_pinned DESC, a.created_at DESC
      LIMIT 100
    `, [userId, ...params]);

    return success(res, { announcements: rows });
  } catch (err) {
    logger.error('Announcements list error: ' + err.message);
    return error(res, err.message, 500);
  }
});

// GET /api/announcements/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const role = req.user.role_slug || req.user.role;

    // Same visibility definition as the list — otherwise the bell badge and the
    // inbox disagree (the exact class of drift QA keeps finding).
    const vis = announcementVisibleSql('a', role);
    const result = await queryOne(`
      SELECT COUNT(*) AS cnt FROM announcements a
      WHERE a.org_id=? AND ${vis.sql}
        AND NOT EXISTS (SELECT 1 FROM announcement_reads WHERE announcement_id=a.id AND user_id=?)
    `, [orgId, ...vis.params, userId]);

    return success(res, { unread_count: result.cnt || 0 });
  } catch (err) { return error(res, err.message, 500); }
});

// GET /api/announcements/:id — single announcement
router.get('/:id', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const a = await queryOne(`
      SELECT a.*, CONCAT(u.first_name,' ',u.last_name) AS creator_name,
             (SELECT r.slug FROM client_user_roles ur JOIN client_roles r ON r.id=ur.role_id WHERE ur.user_id=a.created_by LIMIT 1) AS creator_role,
             (SELECT read_at FROM announcement_reads WHERE announcement_id=a.id AND user_id=?) AS my_read_at
      FROM announcements a LEFT JOIN client_users u ON u.id=a.created_by
      WHERE a.id=? AND a.org_id=?`, [userId, req.params.id, orgId]);
    if (!a) return error(res, 'Announcement not found', 404);

    // Audience check (the list filters this; the detail must too): a non-staff
    // viewer may only open an announcement targeted at their role. 404 to avoid
    // leaking existence of staff-only notices.
    const viewerRole = (req.user.role_slug || '').toLowerCase();
    const ELEVATED = ['owner','admin','principal','coordinator','academic_coordinator','hod','super_admin','system_admin'];
    if (!ELEVATED.includes(viewerRole) && a.created_by !== userId && !targetsRole(a.target_roles, viewerRole)) {
      return error(res, 'Announcement not found', 404);
    }
    return success(res, { announcement: a });
  } catch (err) { return error(res, err.message, 500); }
});

// POST /api/announcements — create (staff only). requireRole matches on base_role
// OR slug, so custom admin-mapped roles (accountant/coordinator/hod) and platform
// admins pass here. The old inner role_slug re-check double-gated and 403'd those
// legitimate roles (slug != base_role) — removed; requireRole is the single gate.
router.post('/', requireRole('owner','admin','principal','teacher','super_admin','system_admin'), upload.array('files', 3), validateUploads, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;

    const {
      title, content, target_roles = 'all', priority = 'medium', category = 'general',
      is_pinned = 0, target_class_ids, target_section_ids, expires_at, scheduled_at,
      send_push = 1, send_email = 0, send_sms = 0, send_whatsapp = 0, status = 'active'
    } = req.body;

    if (!title || !content) return error(res, 'Title and content required', 400);

    // TEACHER-SCOPE: a teacher may announce ONLY to students/parents (never to
    // admins/other staff), and distribution is limited to their taught sections.
    // Clamp the stored target so it also can't surface in staff inboxes.
    const isTeacherCreator = ['teacher', 'class_teacher'].includes((req.user.role_slug || '').toLowerCase());
    // ALWAYS store the canonical comma form. The old code passed the client's raw
    // value straight through, so a client (or seed) sending `["all"]` produced a row
    // that rendered as "To: All" and reached nobody. normalizeTargetRoles() is now
    // the single gate every write passes through.
    let rs = parseTargetRoles(target_roles);
    if (isTeacherCreator) {
      if (rs.includes('all')) rs = ['student', 'parent'];
      rs = rs.filter(r => ['student', 'parent'].includes(r));
      if (!rs.length) rs = ['student', 'parent'];
    }
    const effectiveTargetRoles = normalizeTargetRoles(rs);

    const files = (req.files || []).map(f => ({
      name: f.originalname, path: f.path, size: f.size, mime: f.mimetype,
      url: `/uploads/announcements/${path.basename(f.path)}`
    }));

    const result = await query(`
      INSERT INTO announcements (
        org_id, title, content, target_roles, priority, category, is_pinned,
        target_class_ids, target_section_ids, attachments, expires_at, scheduled_at,
        send_push, send_email, send_sms, send_whatsapp, status, created_by, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
    `, [
      orgId, title, content, effectiveTargetRoles, priority, category, is_pinned ? 1 : 0,
      target_class_ids || null, target_section_ids || null,
      files.length ? JSON.stringify(files) : null,
      expires_at || null, scheduled_at || null,
      send_push ? 1 : 0, send_email ? 1 : 0, send_sms ? 1 : 0, send_whatsapp ? 1 : 0,
      status, userId
    ]);

    const announcementId = result.insertId;

    // ───── Distribute via notifications table (push) ─────
    if (Number(send_push)) {
      const roles = parseTargetRoles(effectiveTargetRoles);
      let recipients;
      if (isTeacherCreator) {
        // scope the blast to students + parents of the teacher's taught sections
        recipients = [];
        const wantStudent = roles.includes('all') || roles.includes('student');
        const wantParent = roles.includes('all') || roles.includes('parent');
        if (wantStudent) {
          recipients.push(...await query(
            `SELECT DISTINCT u.id, 'student' AS role_slug
               FROM client_students st
               JOIN client_users u ON u.id=st.user_id
               JOIN client_enrollments e ON e.student_id=st.id AND e.status='active'
               JOIN client_timetable_slots ts ON ts.section_id=e.section_id
              WHERE ts.teacher_id=? AND ts.org_id=? AND u.org_id=?`, [userId, orgId, orgId]));
        }
        if (wantParent) {
          recipients.push(...await query(
            `SELECT DISTINCT pu.id, 'parent' AS role_slug
               FROM client_students st
               JOIN client_enrollments e ON e.student_id=st.id AND e.status='active'
               JOIN client_timetable_slots ts ON ts.section_id=e.section_id
               JOIN client_parent_students ps ON ps.student_id=st.id
               JOIN client_parents p ON p.id=ps.parent_id
               JOIN client_users pu ON pu.id=p.user_id
              WHERE ts.teacher_id=? AND ts.org_id=?`, [userId, orgId]));
        }
      } else {
        const targetBaseRoles = roles.includes('all') ? ALL_RECIPIENT_BASE_ROLES : roles;
        recipients = await query(
          `SELECT DISTINCT u.id, r.base_role AS role_slug
           FROM client_users u
           JOIN client_user_roles ur ON ur.user_id=u.id
           JOIN client_roles r ON r.id=ur.role_id
           WHERE u.org_id=? AND r.base_role IN (${targetBaseRoles.map(() => '?').join(',')})`,
          [orgId, ...targetBaseRoles]
        );
      }

      for (const r of recipients) {
        try {
          await query(`
            INSERT INTO client_notifications (org_id, recipient_id, recipient_role, user_id, type, title, body, action_url, icon, priority, sender_id, sender_role, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW())
          `, [
            orgId, r.id, r.role_slug, r.id, 'announcement', title,
            content.substring(0, 200),
            `/${r.role_slug}/announcements/${announcementId}`,
            category === 'urgent' ? 'AlertCircle' : category === 'event' ? 'Calendar' : 'Megaphone',
            priority === 'high' ? 'high' : 'normal',
            userId, (req.user.role_slug || 'staff')
          ]);
        } catch (e) { /* non-fatal */ }
      }

      await query('UPDATE announcements SET push_count=? WHERE id=?', [recipients.length, announcementId]);
    }

    // TODO wire email/sms/whatsapp later

    await audit(req, 'ANNOUNCEMENT_PUBLISH', 'announcement', announcementId, { new_data: { title, target_roles: effectiveTargetRoles, category, status } });
    const created = await queryOne('SELECT * FROM announcements WHERE id=?', [announcementId]);
    return success(res, { announcement: created }, 'Published');
  } catch (err) {
    logger.error('Announcement create: ' + err.message);
    return error(res, err.message, 400);
  }
});

// PUT /api/announcements/:id — update (creator or admin)
router.put('/:id', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const role = req.user.role_slug || req.user.role;

    const existing = await queryOne('SELECT * FROM announcements WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!existing) return error(res, 'Not found', 404);
    if (existing.created_by !== userId && !['admin', 'owner'].includes(role)) {
      return error(res, 'Only the creator or admin can edit', 403);
    }

    const {
      title, content, target_roles, priority, category, is_pinned,
      expires_at, scheduled_at, status
    } = req.body;

    await query(`
      UPDATE announcements SET
        title=COALESCE(?, title), content=COALESCE(?, content),
        target_roles=COALESCE(?, target_roles), priority=COALESCE(?, priority),
        category=COALESCE(?, category), is_pinned=COALESCE(?, is_pinned),
        expires_at=?, scheduled_at=?, status=COALESCE(?, status)
      WHERE id=?
    `, [
      title || null, content || null,
      // normalize on update too — otherwise an edit can re-introduce `["all"]`
      target_roles != null && String(target_roles).trim() !== '' ? normalizeTargetRoles(target_roles) : null,
      priority || null,
      category || null, is_pinned != null ? (is_pinned ? 1 : 0) : null,
      expires_at || null, scheduled_at || null, status || null,
      req.params.id
    ]);

    return success(res, {}, 'Updated');
  } catch (err) { return error(res, err.message, 400); }
});

// DELETE /api/announcements/:id
router.delete('/:id', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const role = req.user.role_slug || req.user.role;

    const existing = await queryOne('SELECT created_by FROM announcements WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!existing) return error(res, 'Not found', 404);
    if (existing.created_by !== userId && !['admin', 'owner'].includes(role)) {
      return error(res, 'Only the creator or admin can delete', 403);
    }

    await query('DELETE FROM announcements WHERE id=?', [req.params.id]);
    await query('DELETE FROM announcement_reads WHERE announcement_id=?', [req.params.id]);
    // Also remove the denormalized notification copies (created on publish
    // with action_url=/{role}/announcements/{id}); otherwise deleted
    // announcements linger in the bell and deep-link to a 404.
    await query(
      "DELETE FROM client_notifications WHERE org_id=? AND action_url LIKE ?",
      [orgId, `%/announcements/${req.params.id}`]
    ).catch(() => {});
    await audit(req, 'ANNOUNCEMENT_DELETE', 'announcement', req.params.id, {});
    return success(res, {}, 'Deleted');
  } catch (err) { return error(res, err.message, 400); }
});

// POST /api/announcements/:id/read
router.post('/:id/read', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    // Announcement ids are global — without this gate any user could insert
    // reads against, and rewrite read_count on, another org's announcement.
    const ann = await queryOne('SELECT id FROM announcements WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!ann) return error(res, 'Not found', 404);
    await query(
      `INSERT IGNORE INTO announcement_reads (announcement_id, user_id, org_id) VALUES (?,?,?)`,
      [req.params.id, userId, orgId]
    );
    await query(
      `UPDATE announcements SET read_count = (SELECT COUNT(*) FROM announcement_reads WHERE announcement_id=?) WHERE id=? AND org_id=?`,
      [req.params.id, req.params.id, orgId]
    );
    return success(res, {});
  } catch (err) { return error(res, err.message, 400); }
});

// POST /api/announcements/:id/pin
router.post('/:id/pin', requireRole('owner','admin','principal','teacher','super_admin','system_admin'), async (req, res) => {
  try {
    const { pinned } = req.body;
    await query('UPDATE announcements SET is_pinned=? WHERE id=? AND org_id=?', [pinned ? 1 : 0, req.params.id, req.user.org_id]);
    return success(res, {});
  } catch (err) { return error(res, err.message, 400); }
});

// GET /api/announcements/:id/audience-preview — how many will receive
router.get('/:id/audience-preview', async (req, res) => {
  try {
    const a = await queryOne('SELECT target_roles FROM announcements WHERE id=? AND org_id=?', [req.params.id, req.user.org_id]);
    if (!a) return error(res, 'Not found', 404);
    // Same expansion the publisher uses, so the preview count and the number of
    // notifications actually created agree.
    const roles = parseTargetRoles(a.target_roles);
    const targetBaseRoles = roles.includes('all') ? ALL_RECIPIENT_BASE_ROLES : roles;
    const result = await queryOne(
      `SELECT COUNT(DISTINCT u.id) AS total
       FROM client_users u
       JOIN client_user_roles ur ON ur.user_id=u.id
       JOIN client_roles r ON r.id=ur.role_id
       WHERE u.org_id=? AND r.base_role IN (${targetBaseRoles.map(() => '?').join(',')})`,
      [req.user.org_id, ...targetBaseRoles]
    );
    return success(res, { total: result.total });
  } catch (err) { return error(res, err.message, 400); }
});

// Audience preview by role breakdown (for composer)
router.get('/preview/audience', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const roles = parseTargetRoles(req.query.target_roles);
    const allRoles = ['admin', 'teacher', 'student', 'parent'];
    const targetRoles = roles.includes('all') ? allRoles : roles.filter(r => allRoles.includes(r));


    const rows = await query(
      `SELECT r.base_role AS role_slug, COUNT(DISTINCT u.id) AS cnt
       FROM client_users u
       JOIN client_user_roles ur ON ur.user_id=u.id
       JOIN client_roles r ON r.id=ur.role_id
       WHERE u.org_id=? AND r.base_role IN (${targetRoles.map(() => '?').join(',') || "''"})
       GROUP BY r.base_role`,
      [orgId, ...targetRoles]
    );
    const breakdown = Object.fromEntries(rows.map(r => [r.role_slug, r.cnt]));
    const total = rows.reduce((s, r) => s + r.cnt, 0);
    return success(res, { total, breakdown });
  } catch (err) { return error(res, err.message, 400); }
});

module.exports = router;

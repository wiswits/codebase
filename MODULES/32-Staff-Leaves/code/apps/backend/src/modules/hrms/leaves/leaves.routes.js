const express = require('express');
const notifSvc = require('../../../services/notificationService');
const router = express.Router();
const multer = require('multer');
const { validateUploads } = require('../../../utils/fileMagic');
const path = require('path');
const fs = require('fs');
const svc = require('./leaveService');
const { authenticate } = require('../../../middleware/auth');
const { requireRole } = require('../../../middleware/rbac');
const { success, error } = require('../../../utils/response');
const { audit } = require('../../../utils/audit');

// attachments upload (medical certs etc)
const uploadDir = process.env.LEAVES_DIR || '/var/www/wiswits/uploads/leaves';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _f, cb) => cb(null, uploadDir),
  filename: (_req, f, cb) => {
    const safe = f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const SAFE_UPLOAD_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'application/zip',
]);
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  // SECURITY: block HTML/SVG/scripts/executables — files are served back
  // from /uploads and an unfiltered upload is a stored-XSS/dropper vector.
  fileFilter: (req, file, cb) => {
    if (SAFE_UPLOAD_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error('File type not allowed'));
  },
});

router.use(authenticate);

// Resolve user's role via join (since client_users has no role_slug)
async function getCallerRole(userId) {
  const { queryOne } = require('../../../config/db');
  const r = await queryOne(`
    SELECT r.base_role FROM client_user_roles ur
    JOIN client_roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? LIMIT 1
  `, [userId]);
  return r?.base_role || 'student';
}

// GET /api/leaves/types
router.get('/types', async (req, res) => {
  try {
    const role = await getCallerRole(req.user.user_id);
    const types = await svc.listLeaveTypes(req.user.org_id, role);
    return success(res, { types });
  } catch (e) { return error(res, e.message, 400); }
});

// GET /api/leaves — list with filters
router.get('/', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const role = await getCallerRole(userId);
    const { requests, total } = await svc.listLeaves(req.user.org_id, userId, role, req.query);
    return success(res, { requests, total });
  } catch (e) { return error(res, e.message, 400); }
});

// GET /api/leaves/stats
// Org-wide aggregate leave counts — no role check previously, reachable by
// students. Same staff gate used elsewhere in this codebase for HR ops data.
router.get('/stats', requireRole('owner','admin','principal','coordinator','hod','super_admin','system_admin'), async (req, res) => {
  try {
    const stats = await svc.getStats(req.user.org_id);
    return success(res, { stats });
  } catch (e) { return error(res, e.message, 400); }
});

// GET /api/leaves/:id
router.get('/:id', async (req, res) => {
  try {
    const leave = await svc.getLeave(req.user.org_id, req.params.id);
    if (!leave) return error(res, 'Not found', 404);
    if (!(await svc.canViewLeave(req.user, leave))) return error(res, 'Forbidden', 403);
    return success(res, { leave });
  } catch (e) { return error(res, e.message, 400); }
});

// POST /api/leaves
router.post('/', upload.array('files', 3), validateUploads, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const role = await getCallerRole(userId);
    const files = (req.files || []).map(f => ({
      name: f.originalname, size: f.size, mime: f.mimetype,
      url: `/uploads/leaves/${path.basename(f.path)}`
    }));
    const payload = { ...req.body, attachments: files };
    if (payload.half_day) payload.half_day = payload.half_day === '1' || payload.half_day === 'true' ? 1 : 0;
    if (payload.student_id) payload.student_id = parseInt(payload.student_id);
    const leave = await svc.createLeave({
      orgId: req.user.org_id,
      applicantUserId: userId,
      applicantRole: role,
      payload
    });
    // Notify admins of new leave request
    try {
      await notifSvc.sendToAdmins(req.user.org_id, {
        type: 'leave_request',
        title: 'New leave request',
        body: `${role === 'student' ? 'Student' : 'Staff'} leave request pending approval`,
        action_url: '/admin/leaves',
        icon: 'Calendar',
        priority: 'normal',
        sender_id: userId,
        sender_role: role,
      });
    } catch (e) { /* non-fatal */ }
    return success(res, { leave }, 'Leave request submitted');
  } catch (e) { return error(res, e.message, 400); }
});

// POST /api/leaves/:id/approve
router.post('/:id/approve', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const role = await getCallerRole(userId);
    const leave = await svc.decideLeave(req.user.org_id, req.params.id, userId, role, 'approve', req.body.remarks);
    await audit(req, 'LEAVE_APPROVE', 'leave', req.params.id, { new_data: { remarks: req.body.remarks || null } });
    try {
      if (leave && leave.applicant_user_id) {
        await notifSvc.send(req.user.org_id, {
          type: 'leave_approved',
          title: 'Leave approved ✓',
          body: `Your leave request has been approved.`,
          action_url: `/${leave.applicant_role || 'teacher'}/leaves`,
          icon: 'CheckCircle2',
          priority: 'normal',
          recipient_id: leave.applicant_user_id,
          recipient_role: leave.applicant_role || 'teacher',
          sender_id: userId,
          sender_role: 'admin',
        });
      }
    } catch (e) { /* non-fatal */ }
    return success(res, { leave }, 'Approved');
  } catch (e) { return error(res, e.message, 400); }
});

// POST /api/leaves/:id/reject
router.post('/:id/reject', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const role = await getCallerRole(userId);
    const leave = await svc.decideLeave(req.user.org_id, req.params.id, userId, role, 'reject', req.body.remarks);
    await audit(req, 'LEAVE_REJECT', 'leave', req.params.id, { new_data: { remarks: req.body.remarks || null } });
    try {
      if (leave && leave.applicant_user_id) {
        await notifSvc.send(req.user.org_id, {
          type: 'leave_rejected',
          title: 'Leave request declined',
          body: req.body.remarks ? `Reason: ${req.body.remarks}` : 'Your leave request was not approved.',
          action_url: `/${leave.applicant_role || 'teacher'}/leaves`,
          icon: 'AlertCircle',
          priority: 'high',
          recipient_id: leave.applicant_user_id,
          recipient_role: leave.applicant_role || 'teacher',
          sender_id: userId,
          sender_role: 'admin',
        });
      }
    } catch (e) { /* non-fatal */ }
    return success(res, { leave }, 'Rejected');
  } catch (e) { return error(res, e.message, 400); }
});

// POST /api/leaves/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const userId = req.user.user_id;
    await svc.cancelLeave(req.user.org_id, req.params.id, userId);
    return success(res, {}, 'Cancelled');
  } catch (e) { return error(res, e.message, 400); }
});

// GET /api/leaves/student/children — parent fetches own children to pick from
router.get('/parent/children', async (req, res) => {
  try {
    const { query } = require('../../../config/db');
    const userId = req.user.user_id;
    const rows = await query(`
      SELECT st.id, st.admission_number, CONCAT(u.first_name,' ',u.last_name) AS name,
             sec.name AS section_name, cls.name AS class_name
      FROM client_parents p
      JOIN client_parent_students ps ON ps.parent_id = p.id
      JOIN client_students st ON st.id = ps.student_id
      JOIN client_users u ON u.id = st.user_id
      LEFT JOIN client_enrollments e ON e.student_id = st.id
      LEFT JOIN client_sections sec ON sec.id = e.section_id
      LEFT JOIN client_classes cls ON cls.id = sec.class_id
      WHERE p.user_id = ?
    `, [userId]);
    return success(res, { children: rows });
  } catch (e) { return error(res, e.message, 400); }
});

module.exports = router;

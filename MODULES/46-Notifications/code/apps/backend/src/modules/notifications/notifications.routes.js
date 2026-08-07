const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const notifSvc = require('../../services/notificationService');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const o   = req.user.org_id;
    const uid = req.user.user_id;
    const { limit = 50, unread_only = 0 } = req.query;

    let where = 'WHERE org_id=? AND recipient_id=?';
    const params = [o, uid];
    if (unread_only == 1) where += ' AND read_at IS NULL';

    const notifs = await query(
      `SELECT * FROM client_notifications ${where}
       ORDER BY created_at DESC LIMIT ?`,
      [...params, parseInt(limit)]
    );

    const unreadCount = await queryOne(
      'SELECT COUNT(*) AS cnt FROM client_notifications WHERE org_id=? AND recipient_id=? AND read_at IS NULL',
      [o, uid]
    );

    return success(res, {
      notifications: notifs.map(n => ({
        ...n,
        meta: n.meta ? (typeof n.meta === 'string' ? JSON.parse(n.meta) : n.meta) : null,
      })),
      unread_count: unreadCount?.cnt || 0,
    });
  } catch(e) { return error(res, e.message, 500); }
});

router.put('/:id/read', async (req, res) => {
  try {
    const o   = req.user.org_id;
    const uid = req.user.user_id;
    await query(
      `UPDATE client_notifications SET read_at=NOW()
       WHERE id=? AND org_id=? AND recipient_id=? AND read_at IS NULL`,
      [req.params.id, o, uid]
    );
    return success(res, {}, 'Marked read');
  } catch(e) { return error(res, e.message, 500); }
});

router.put('/read-all', async (req, res) => {
  try {
    const o   = req.user.org_id;
    const uid = req.user.user_id;
    await query(
      `UPDATE client_notifications SET read_at=NOW()
       WHERE org_id=? AND recipient_id=? AND read_at IS NULL`,
      [o, uid]
    );
    return success(res, {}, 'All marked read');
  } catch(e) { return error(res, e.message, 500); }
});

router.delete('/:id', async (req, res) => {
  try {
    const o   = req.user.org_id;
    const uid = req.user.user_id;
    await query(
      'DELETE FROM client_notifications WHERE id=? AND org_id=? AND recipient_id=?',
      [req.params.id, o, uid]
    );
    return success(res, {}, 'Deleted');
  } catch(e) { return error(res, e.message, 500); }
});

router.get('/unread-count', async (req, res) => {
  try {
    const o   = req.user.org_id;
    const uid = req.user.user_id;
    const row = await queryOne(
      'SELECT COUNT(*) AS cnt FROM client_notifications WHERE org_id=? AND recipient_id=? AND read_at IS NULL',
      [o, uid]
    );
    return success(res, { unread_count: row?.cnt || 0 });
  } catch(e) { return error(res, e.message, 500); }
});

router.post('/broadcast', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { target_role, title, body, action_url, icon, priority } = req.body;
    if (!target_role || !title) return error(res, 'target_role and title required', 400);

    const users = await query(
      `SELECT u.id FROM client_users u
       JOIN client_user_roles ur ON ur.user_id=u.id
       JOIN client_roles r ON r.id=ur.role_id
       WHERE u.org_id=? AND u.is_active=1 AND r.base_role=?`,
      [o, target_role]
    );

    const recipients = users.map(u => ({ id: u.id, role: target_role }));
    const r = await notifSvc.sendBulk(o, recipients, {
      type: 'announcement',
      title, body, action_url, icon, priority,
      sender_id: req.user.user_id,
      sender_role: 'admin',
    });
    return success(res, r, `Sent to ${r.sent} users`);
  } catch(e) { return error(res, e.message, 500); }
});

module.exports = router;

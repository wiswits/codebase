const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get user notifications
router.get('/:userId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM notifications WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 50`,
      [req.params.userId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get unread count
router.get('/unread/:userId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE AND deleted_at IS NULL`,
      [req.params.userId]
    );
    res.json({ data: { unread: rows[0].count } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Mark as read
router.put('/:id/read', async (req, res) => {
  try {
    await db.query(`UPDATE notifications SET is_read = TRUE WHERE id = ?`, [req.params.id]);
    res.json({ meta: { message: 'Notification marked as read' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Mark all as read
router.put('/read-all/:userId', async (req, res) => {
  try {
    await db.query(`UPDATE notifications SET is_read = TRUE WHERE user_id = ?`, [req.params.userId]);
    res.json({ meta: { message: 'All notifications marked as read' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = { router };
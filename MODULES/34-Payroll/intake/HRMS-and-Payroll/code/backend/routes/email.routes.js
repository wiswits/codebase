const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Send email
router.post('/send', async (req, res) => {
  const { recipient_email, subject, body } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO email_logs (org_id, recipient_email, subject, body, status) VALUES (1, ?, ?, ?, 'SENT')`,
      [recipient_email, subject, body]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: `Email sent to ${recipient_email}` } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get email logs
router.get('/logs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM email_logs WHERE deleted_at IS NULL ORDER BY created_at DESC');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
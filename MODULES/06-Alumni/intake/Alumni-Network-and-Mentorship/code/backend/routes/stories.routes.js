const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Submit story
router.post('/', auth, async (req, res) => {
  const { alumni_id, title, category, content, image_url } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO success_stories (org_id, alumni_id, title, category, content, image_url, status)
       VALUES (1, ?, ?, ?, ?, ?, 'PENDING')`,
      [alumni_id, title, category, content, image_url]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Story submitted' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get all stories
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.full_name as author_name 
       FROM success_stories s
       JOIN users u ON u.id = s.alumni_id
       WHERE s.deleted_at IS NULL AND s.status IN ('APPROVED', 'FEATURED')
       ORDER BY s.created_at DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get pending stories (Admin only)
router.get('/pending', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.full_name as author_name 
       FROM success_stories s
       JOIN users u ON u.id = s.alumni_id
       WHERE s.deleted_at IS NULL AND s.status = 'PENDING'
       ORDER BY s.created_at ASC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Moderate story (Admin only)
router.put('/:id/moderate', auth, async (req, res) => {
  const { status, approved_by } = req.body;
  try {
    await db.query(
      `UPDATE success_stories SET status = ?, approved_by = ?, approved_at = NOW(3) WHERE id = ?`,
      [status, approved_by, req.params.id]
    );
    res.json({ meta: { message: `Story ${status.toLowerCase()}` } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get my stories
router.get('/my/:alumniId', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM success_stories WHERE alumni_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [req.params.alumniId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Delete story
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('UPDATE success_stories SET deleted_at = NOW(3) WHERE id = ?', [req.params.id]);
    res.json({ meta: { message: 'Story deleted' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
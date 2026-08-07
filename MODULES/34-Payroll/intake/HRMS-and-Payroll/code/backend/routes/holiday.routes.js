// backend/routes/holiday.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create Holiday
router.post('/holidays', async (req, res) => {
  const { name, date, type, description, is_optional } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO holidays (org_id, name, date, type, description, is_optional)
       VALUES (1, ?, ?, ?, ?, ?)`,
      [name, date, type, description, is_optional || false]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Holiday added' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get all holidays
router.get('/holidays', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM holidays WHERE deleted_at IS NULL ORDER BY date ASC');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get holidays by year
router.get('/holidays/:year', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM holidays WHERE YEAR(date) = ? AND deleted_at IS NULL ORDER BY date ASC',
      [req.params.year]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Delete holiday
router.delete('/holidays/:id', async (req, res) => {
  try {
    await db.query('UPDATE holidays SET deleted_at = NOW(3) WHERE id = ?', [req.params.id]);
    res.json({ meta: { message: 'Holiday deleted' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
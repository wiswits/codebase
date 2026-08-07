// backend/routes/rewards.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================
// REWARDS
// ============================================================

// Award reward
router.post('/rewards', async (req, res) => {
  const { employee_id, reward_type, title, description, points, awarded_by } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO rewards 
       (org_id, employee_id, reward_type, title, description, points, awarded_by)
       VALUES (1, ?, ?, ?, ?, ?, ?)`,
      [employee_id, reward_type, title, description, points || 10, awarded_by]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Reward awarded' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get employee rewards
router.get('/rewards/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, CONCAT(e.first_name, ' ', e.last_name) as awarded_by_name
       FROM rewards r
       JOIN employees e ON e.id = r.awarded_by
       WHERE r.employee_id = ? AND r.deleted_at IS NULL
       ORDER BY r.awarded_at DESC`,
      [req.params.employeeId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get all rewards (Admin)
router.get('/rewards/all', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, 
              CONCAT(emp.first_name, ' ', emp.last_name) as employee_name,
              CONCAT(a.first_name, ' ', a.last_name) as awarded_by_name
       FROM rewards r
       JOIN employees emp ON emp.id = r.employee_id
       JOIN employees a ON a.id = r.awarded_by
       WHERE r.deleted_at IS NULL
       ORDER BY r.awarded_at DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get total points for employee
router.get('/points/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT SUM(points) as total_points FROM rewards WHERE employee_id = ? AND deleted_at IS NULL',
      [req.params.employeeId]
    );
    res.json({ data: { total_points: rows[0]?.total_points || 0 } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// BADGES
// ============================================================

// Award badge
router.post('/badges', async (req, res) => {
  const { employee_id, badge_name, badge_icon, description } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO badges (org_id, employee_id, badge_name, badge_icon, description)
       VALUES (1, ?, ?, ?, ?)`,
      [employee_id, badge_name, badge_icon, description]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Badge awarded' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get employee badges
router.get('/badges/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM badges WHERE employee_id = ? AND deleted_at IS NULL ORDER BY awarded_at DESC',
      [req.params.employeeId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get all badges (Admin)
router.get('/badges/all', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
       FROM badges b
       JOIN employees e ON e.id = b.employee_id
       WHERE b.deleted_at IS NULL
       ORDER BY b.awarded_at DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
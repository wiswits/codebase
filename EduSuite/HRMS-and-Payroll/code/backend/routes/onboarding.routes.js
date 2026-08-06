// backend/routes/onboarding.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get employee onboarding tasks
router.get('/tasks/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM onboarding_tasks 
       WHERE employee_id = ? AND deleted_at IS NULL 
       ORDER BY due_date ASC`,
      [req.params.employeeId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Create onboarding tasks
router.post('/tasks', async (req, res) => {
  const { employee_id, tasks } = req.body;
  try {
    const inserted = [];
    for (const task of tasks) {
      const [result] = await db.query(
        `INSERT INTO onboarding_tasks 
         (org_id, employee_id, task_name, task_description, due_date, status)
         VALUES (1, ?, ?, ?, ?, 'PENDING')`,
        [employee_id, task.task_name, task.task_description, task.due_date]
      );
      inserted.push({ id: result.insertId, ...task });
    }
    res.status(201).json({
      data: inserted,
      meta: { message: `${inserted.length} onboarding tasks created` }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Update task status
router.put('/tasks/:id', async (req, res) => {
  const { status } = req.body;
  try {
    const completedAt = status === 'COMPLETED' ? 'NOW(3)' : 'NULL';
    await db.query(
      `UPDATE onboarding_tasks 
       SET status = ?, completed_at = ${completedAt}
       WHERE id = ?`,
      [status, req.params.id]
    );
    res.json({ meta: { message: 'Task updated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get onboarding progress
router.get('/progress/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) as overdue
       FROM onboarding_tasks 
       WHERE employee_id = ? AND deleted_at IS NULL`,
      [req.params.employeeId]
    );
    const total = rows[0]?.total || 0;
    const completed = rows[0]?.completed || 0;
    res.json({
      data: {
        ...rows[0],
        progress: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ✅ YEH LINE HONI CHAHIYE - SABSE END MEIN!
module.exports = router;
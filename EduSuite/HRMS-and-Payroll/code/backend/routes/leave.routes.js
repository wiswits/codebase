const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get leave types
router.get('/types', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM leave_types WHERE deleted_at IS NULL ORDER BY id');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Apply leave
router.post('/requests', async (req, res) => {
  const { employee_id, leave_type_id, from_date, to_date, days, reason } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO leave_requests (org_id, employee_id, leave_type_id, from_date, to_date, days, reason, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [employee_id, leave_type_id, from_date, to_date, days, reason]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Leave request submitted' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get employee leave requests
router.get('/requests/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT lr.*, lt.name as leave_type_name FROM leave_requests lr
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.employee_id = ? AND lr.deleted_at IS NULL ORDER BY lr.created_at DESC`,
      [req.params.employeeId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Approve leave
router.put('/requests/:id/approve', async (req, res) => {
  try {
    await db.query(`UPDATE leave_requests SET status = 'APPROVED' WHERE id = ? AND status = 'PENDING'`, [req.params.id]);
    res.json({ meta: { message: 'Leave approved' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Reject leave
router.put('/requests/:id/reject', async (req, res) => {
  try {
    await db.query(`UPDATE leave_requests SET status = 'REJECTED' WHERE id = ? AND status = 'PENDING'`, [req.params.id]);
    res.json({ meta: { message: 'Leave rejected' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Submit expense claim
router.post('/claims', async (req, res) => {
  const { employee_id, title, description, amount, expense_date, receipt_path } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO expense_claims (org_id, employee_id, title, description, amount, expense_date, receipt_path, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [employee_id, title, description, amount, expense_date, receipt_path]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Expense claim submitted' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get employee claims
router.get('/claims/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM expense_claims WHERE employee_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [req.params.employeeId]);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get pending claims
router.get('/claims/pending/all', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ec.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
       FROM expense_claims ec
       JOIN employees e ON e.id = ec.employee_id
       WHERE ec.status = 'PENDING' AND ec.deleted_at IS NULL
       ORDER BY ec.created_at ASC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Approve claim
router.put('/claims/:id/approve', async (req, res) => {
  const { approved_by } = req.body;
  try {
    await db.query(`UPDATE expense_claims SET status = 'APPROVED', approved_by = ?, approved_at = NOW(3) WHERE id = ? AND status = 'PENDING'`, [approved_by, req.params.id]);
    res.json({ meta: { message: 'Expense claim approved' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Reject claim
router.put('/claims/:id/reject', async (req, res) => {
  try {
    await db.query(`UPDATE expense_claims SET status = 'REJECTED' WHERE id = ? AND status = 'PENDING'`, [req.params.id]);
    res.json({ meta: { message: 'Expense claim rejected' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
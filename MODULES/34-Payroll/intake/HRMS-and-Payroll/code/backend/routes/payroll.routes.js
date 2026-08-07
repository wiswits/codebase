const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get salary components
router.get('/components', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM salary_components WHERE deleted_at IS NULL ORDER BY display_order');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Create payroll run
router.post('/runs', async (req, res) => {
  const { period_month, period_year, run_type = 'REGULAR' } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO payroll_runs (org_id, period_month, period_year, run_type, status)
       VALUES (1, ?, ?, ?, 'DRAFT')`,
      [period_month, period_year, run_type]
    );
    res.status(201).json({ data: { id: result.insertId, status: 'DRAFT' }, meta: { message: 'Payroll run created' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get payroll runs
router.get('/runs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payroll_runs WHERE deleted_at IS NULL ORDER BY created_at DESC');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Lock payroll run
router.put('/runs/:id/lock', async (req, res) => {
  try {
    await db.query(`UPDATE payroll_runs SET status = 'LOCKED' WHERE id = ? AND status = 'DRAFT'`, [req.params.id]);
    res.json({ meta: { message: 'Payroll run locked' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Approve payroll run
router.put('/runs/:id/approve', async (req, res) => {
  try {
    await db.query(`UPDATE payroll_runs SET status = 'APPROVED' WHERE id = ? AND status = 'LOCKED'`, [req.params.id]);
    res.json({ meta: { message: 'Payroll run approved' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
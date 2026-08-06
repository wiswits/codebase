const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Initiate exit
router.post('/exits', async (req, res) => {
  const { employee_id, resignation_date, notice_days_required, exit_type, reason } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO exits (org_id, employee_id, resignation_date, notice_days_required, exit_type, reason, status)
       VALUES (1, ?, ?, ?, ?, ?, 'INITIATED')`,
      [employee_id, resignation_date, notice_days_required, exit_type, reason]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Exit initiated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get employee exits
router.get('/exits/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM exits WHERE employee_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [req.params.employeeId]);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Approve exit
router.put('/exits/:id/approve', async (req, res) => {
  const { last_working_day } = req.body;
  try {
    await db.query(`UPDATE exits SET status = 'APPROVED', last_working_day = ? WHERE id = ?`, [last_working_day, req.params.id]);
    res.json({ meta: { message: 'Exit approved' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Calculate F&F
router.post('/fnf/calculate', async (req, res) => {
  const { exit_id, final_salary, gratuity_amount, leave_encashment, bonus_amount, notice_recovery, loan_recovery, asset_recovery } = req.body;
  try {
    const net = final_salary + gratuity_amount + leave_encashment + bonus_amount - notice_recovery - loan_recovery - asset_recovery;
    const [result] = await db.query(
      `INSERT INTO fnf_settlements (org_id, exit_id, final_salary, gratuity_amount, leave_encashment, bonus_amount, notice_recovery, loan_recovery, asset_recovery, net_settlement, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')`,
      [exit_id, final_salary, gratuity_amount, leave_encashment, bonus_amount, notice_recovery, loan_recovery, asset_recovery, net]
    );
    res.status(201).json({ data: { id: result.insertId, net_settlement: net }, meta: { message: 'F&F calculated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get F&F
router.get('/fnf/:exitId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM fnf_settlements WHERE exit_id = ? AND deleted_at IS NULL', [req.params.exitId]);
    res.json({ data: rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
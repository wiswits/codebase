const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Submit CPD
router.post('/records', async (req, res) => {
  const { employee_id, fy, title, provider, activity_date, hours } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO cpd_records (org_id, employee_id, fy, title, provider, activity_date, hours, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, 'SUBMITTED')`,
      [employee_id, fy, title, provider, activity_date, hours]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'CPD activity submitted' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get CPD records
router.get('/records/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM cpd_records WHERE employee_id = ? AND deleted_at IS NULL ORDER BY activity_date DESC',
      [req.params.employeeId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get CPD summary
router.get('/summary/:employeeId/:fy', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT SUM(CASE WHEN status = 'VERIFIED' THEN hours ELSE 0 END) as verified_hours,
              COUNT(*) as total_activities
       FROM cpd_records WHERE employee_id = ? AND fy = ? AND deleted_at IS NULL`,
      [req.params.employeeId, req.params.fy]
    );
    const verified = rows[0]?.verified_hours || 0;
    res.json({ data: { verified_hours: verified, progress: Math.min(100, (verified / 50) * 100) } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Verify CPD
router.put('/records/:id/verify', async (req, res) => {
  try {
    await db.query(`UPDATE cpd_records SET status = 'VERIFIED', verified_at = NOW(3) WHERE id = ?`, [req.params.id]);
    res.json({ meta: { message: 'CPD verified' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Reject CPD
router.put('/records/:id/reject', async (req, res) => {
  const { reject_reason } = req.body;
  try {
    await db.query(`UPDATE cpd_records SET status = 'REJECTED', reject_reason = ? WHERE id = ?`, [reject_reason, req.params.id]);
    res.json({ meta: { message: 'CPD rejected' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
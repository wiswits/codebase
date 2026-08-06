const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create cycle
router.post('/cycles', async (req, res) => {
  const { name, period_from, period_to, status = 'DRAFT' } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO appraisal_cycles (org_id, name, period_from, period_to, status) VALUES (1, ?, ?, ?, ?)`,
      [name, period_from, period_to, status]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Cycle created' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get cycles
router.get('/cycles', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM appraisal_cycles WHERE deleted_at IS NULL ORDER BY created_at DESC');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Create appraisal
router.post('/appraisals', async (req, res) => {
  const { cycle_id, employee_id, appraiser_id } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO appraisals (org_id, cycle_id, employee_id, appraiser_id, status) VALUES (1, ?, ?, ?, 'PENDING_SELF')`,
      [cycle_id, employee_id, appraiser_id]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Appraisal created' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get employee appraisals
router.get('/appraisals/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, ac.name as cycle_name FROM appraisals a
       JOIN appraisal_cycles ac ON ac.id = a.cycle_id
       WHERE a.employee_id = ? AND a.deleted_at IS NULL`,
      [req.params.employeeId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Add KRA
router.post('/kras', async (req, res) => {
  const { appraisal_id, kra_title, weightage_pct, target } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO appraisal_kras (org_id, appraisal_id, kra_title, weightage_pct, target) VALUES (1, ?, ?, ?, ?)`,
      [appraisal_id, kra_title, weightage_pct, target]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'KRA added' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get KRAs
router.get('/kras/:appraisalId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM appraisal_kras WHERE appraisal_id = ? AND deleted_at IS NULL', [req.params.appraisalId]);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
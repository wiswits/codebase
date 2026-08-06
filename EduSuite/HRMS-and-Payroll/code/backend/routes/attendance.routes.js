// backend/routes/attendance.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Check-in
router.post('/check-in', async (req, res) => {
  const { employee_id, latitude, longitude, source = 'WEB' } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0];

  try {
    const [existing] = await db.query(
      `SELECT id FROM attendance WHERE employee_id = ? AND attendance_date = ? AND check_in_time IS NOT NULL`,
      [employee_id, today]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: { message: 'Already checked in today' } });
    }

    const [result] = await db.query(
      `INSERT INTO attendance (org_id, employee_id, attendance_date, check_in_time, status, latitude, longitude, check_in_source)
       VALUES (1, ?, ?, ?, 'PRESENT', ?, ?, ?)`,
      [employee_id, today, now, latitude, longitude, source]
    );
    res.status(201).json({ data: { id: result.insertId, check_in_time: now }, meta: { message: '✅ Checked in' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Check-out
router.post('/check-out', async (req, res) => {
  const { employee_id, latitude, longitude, source = 'WEB' } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0];

  try {
    const [attendance] = await db.query(
      `SELECT id, check_in_time FROM attendance WHERE employee_id = ? AND attendance_date = ? AND check_out_time IS NULL`,
      [employee_id, today]
    );
    if (attendance.length === 0) {
      return res.status(404).json({ error: { message: 'No check-in found for today' } });
    }

    const checkIn = attendance[0].check_in_time;
    const worked = (new Date(`1970-01-01T${now}`) - new Date(`1970-01-01T${checkIn}`)) / (1000 * 60 * 60);

    await db.query(
      `UPDATE attendance SET check_out_time = ?, worked_hours = ?, latitude = ?, longitude = ?, check_out_source = ? WHERE id = ?`,
      [now, parseFloat(worked.toFixed(2)), latitude, longitude, source, attendance[0].id]
    );
    res.json({ data: { check_out_time: now, worked_hours: parseFloat(worked.toFixed(2)) }, meta: { message: '✅ Checked out' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get today's attendance
router.get('/today/:employeeId', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const [rows] = await db.query(`SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?`, [req.params.employeeId, today]);
    res.json({ data: rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get monthly attendance
router.get('/monthly/:employeeId/:month/:year', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT attendance_date, status, check_in_time, check_out_time, worked_hours
       FROM attendance WHERE employee_id = ? AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ? ORDER BY attendance_date`,
      [req.params.employeeId, req.params.month, req.params.year]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get attendance summary
router.get('/summary/:employeeId/:month/:year', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'HALF_DAY' THEN 1 END) as half_day,
        COUNT(CASE WHEN status = 'ON_LEAVE' THEN 1 END) as on_leave
       FROM attendance WHERE employee_id = ? AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?`,
      [req.params.employeeId, req.params.month, req.params.year]
    );
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
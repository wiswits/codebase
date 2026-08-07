const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Create donation
router.post('/', auth, async (req, res) => {
  const { alumni_id, purpose, amount, donation_date, notes } = req.body;
  
  // Generate receipt number
  const receipt_number = `WIS/DON/${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

  try {
    const [result] = await db.query(
      `INSERT INTO donations (org_id, alumni_id, purpose, amount, donation_date, receipt_number, status, notes)
       VALUES (1, ?, ?, ?, ?, ?, 'CONFIRMED', ?)`,
      [alumni_id, purpose, amount, donation_date, receipt_number, notes]
    );
    res.status(201).json({ 
      data: { id: result.insertId, receipt_number }, 
      meta: { message: 'Donation recorded successfully' } 
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get all donations
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, u.full_name as alumni_name 
       FROM donations d
       JOIN users u ON u.id = d.alumni_id
       WHERE d.deleted_at IS NULL
       ORDER BY d.donation_date DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get my donations
router.get('/my/:alumniId', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM donations WHERE alumni_id = ? AND deleted_at IS NULL ORDER BY donation_date DESC',
      [req.params.alumniId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get donation summary
router.get('/summary', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        SUM(amount) as total_amount,
        COUNT(*) as total_donations,
        SUM(CASE WHEN purpose LIKE '%Scholarship%' THEN amount ELSE 0 END) as scholarship_fund,
        SUM(CASE WHEN purpose LIKE '%Infrastructure%' THEN amount ELSE 0 END) as infrastructure_fund,
        SUM(CASE WHEN purpose LIKE '%Event%' THEN amount ELSE 0 END) as event_fund
       FROM donations WHERE deleted_at IS NULL AND status = 'CONFIRMED'`
    );
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get donation receipt
router.get('/receipt/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, u.full_name as alumni_name 
       FROM donations d
       JOIN users u ON u.id = d.alumni_id
       WHERE d.id = ? AND d.deleted_at IS NULL`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Receipt not found' } });
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
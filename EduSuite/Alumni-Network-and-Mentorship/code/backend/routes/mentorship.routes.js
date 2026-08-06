const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// ============================================================
// 1. CREATE MENTORSHIP OFFER
// ============================================================
router.post('/offers', auth, async (req, res) => {
  const { alumni_id, topic, description, industry, availability, max_students } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO mentorship_offers 
       (org_id, alumni_id, topic, description, industry, availability, max_students, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [alumni_id, topic, description, industry, availability, max_students || 5]
    );
    res.status(201).json({ 
      data: { id: result.insertId }, 
      meta: { message: 'Mentorship offer created successfully' } 
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 2. GET ALL ACTIVE OFFERS
// ============================================================
router.get('/offers', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mo.*, u.full_name, u.email 
       FROM mentorship_offers mo
       JOIN users u ON u.id = mo.alumni_id
       WHERE mo.status = 'ACTIVE' AND mo.deleted_at IS NULL
       ORDER BY mo.created_at DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 3. GET OFFERS BY ALUMNI
// ============================================================
router.get('/offers/alumni/:alumniId', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM mentorship_offers WHERE alumni_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [req.params.alumniId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 4. REQUEST MENTORSHIP
// ============================================================
router.post('/requests', auth, async (req, res) => {
  const { offer_id, student_id, message } = req.body;

  try {
    // Check if already requested
    const [existing] = await db.query(
      'SELECT id FROM mentorship_requests WHERE offer_id = ? AND student_id = ? AND status IN ("PENDING", "ACCEPTED")',
      [offer_id, student_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ 
        error: { message: 'You have already requested this mentorship' } 
      });
    }

    const [result] = await db.query(
      `INSERT INTO mentorship_requests (org_id, offer_id, student_id, message, status)
       VALUES (1, ?, ?, ?, 'PENDING')`,
      [offer_id, student_id, message]
    );
    res.status(201).json({ 
      data: { id: result.insertId }, 
      meta: { message: 'Mentorship request sent successfully' } 
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 5. GET PENDING REQUESTS FOR ALUMNI
// ============================================================
router.get('/requests/pending/:alumniId', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mr.*, u.full_name, u.email 
       FROM mentorship_requests mr
       JOIN users u ON u.id = mr.student_id
       JOIN mentorship_offers mo ON mo.id = mr.offer_id
       WHERE mo.alumni_id = ? AND mr.status = 'PENDING' AND mr.deleted_at IS NULL
       ORDER BY mr.created_at ASC`,
      [req.params.alumniId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 6. GET STUDENT REQUESTS
// ============================================================
router.get('/requests/student/:studentId', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mr.*, mo.topic, mo.industry, u.full_name as alumni_name
       FROM mentorship_requests mr
       JOIN mentorship_offers mo ON mo.id = mr.offer_id
       JOIN users u ON u.id = mo.alumni_id
       WHERE mr.student_id = ? AND mr.deleted_at IS NULL
       ORDER BY mr.created_at DESC`,
      [req.params.studentId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 7. ACCEPT/REJECT MENTORSHIP REQUEST
// ============================================================
router.put('/requests/:id', auth, async (req, res) => {
  const { status } = req.body;

  try {
    await db.query(
      'UPDATE mentorship_requests SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ meta: { message: `Mentorship request ${status.toLowerCase()}` } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 8. UPDATE OFFER STATUS
// ============================================================
router.put('/offers/:id/status', auth, async (req, res) => {
  const { status } = req.body;

  try {
    await db.query(
      'UPDATE mentorship_offers SET status = ? WHERE id = ? AND deleted_at IS NULL',
      [status, req.params.id]
    );
    res.json({ meta: { message: 'Offer status updated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
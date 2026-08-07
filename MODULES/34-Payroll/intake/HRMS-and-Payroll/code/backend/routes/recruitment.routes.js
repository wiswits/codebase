// backend/routes/recruitment.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================
// JOB POSTINGS
// ============================================================

// Create job posting
router.post('/postings', async (req, res) => {
  const { title, department, location, employment_type, description, requirements, salary_range, status = 'DRAFT' } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO job_postings 
       (org_id, title, department, location, employment_type, description, requirements, salary_range, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, department, location, employment_type, description, requirements, salary_range, status]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Job posting created' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get all job postings
router.get('/postings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM job_postings WHERE deleted_at IS NULL ORDER BY created_at DESC');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get job posting by ID
router.get('/postings/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM job_postings WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Job posting not found' } });
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Update job posting
router.put('/postings/:id', async (req, res) => {
  const { title, department, location, employment_type, description, requirements, salary_range, status } = req.body;
  try {
    await db.query(
      `UPDATE job_postings SET title = ?, department = ?, location = ?, employment_type = ?, description = ?, requirements = ?, salary_range = ?, status = ? WHERE id = ? AND deleted_at IS NULL`,
      [title, department, location, employment_type, description, requirements, salary_range, status, req.params.id]
    );
    res.json({ meta: { message: 'Job posting updated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Delete job posting
router.delete('/postings/:id', async (req, res) => {
  try {
    await db.query('UPDATE job_postings SET deleted_at = NOW(3) WHERE id = ?', [req.params.id]);
    res.json({ meta: { message: 'Job posting deleted' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// JOB APPLICATIONS
// ============================================================

// Submit application
router.post('/applications', async (req, res) => {
  const { job_posting_id, applicant_name, applicant_email, applicant_phone, resume_path, cover_letter } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO job_applications 
       (org_id, job_posting_id, applicant_name, applicant_email, applicant_phone, resume_path, cover_letter, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [job_posting_id, applicant_name, applicant_email, applicant_phone, resume_path, cover_letter]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Application submitted' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get applications for a job
router.get('/applications/:jobPostingId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM job_applications WHERE job_posting_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [req.params.jobPostingId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Update application status
router.put('/applications/:id', async (req, res) => {
  const { status, notes } = req.body;
  try {
    await db.query(
      `UPDATE job_applications SET status = ?, notes = ? WHERE id = ? AND deleted_at IS NULL`,
      [status, notes, req.params.id]
    );
    res.json({ meta: { message: 'Application updated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
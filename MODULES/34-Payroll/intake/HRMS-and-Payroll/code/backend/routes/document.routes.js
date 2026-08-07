const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Upload document
router.post('/upload', async (req, res) => {
  const { employee_id, doc_type, document_name, file_path } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO employee_documents (org_id, employee_id, doc_type, document_name, file_path)
       VALUES (1, ?, ?, ?, ?)`,
      [employee_id, doc_type, document_name, file_path]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Document uploaded' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get employee documents
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM employee_documents WHERE employee_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [req.params.employeeId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Add qualification
router.post('/qualifications', async (req, res) => {
  const { employee_id, qualification, institution, issued_on, expires_on } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO employee_qualifications (org_id, employee_id, qualification, institution, issued_on, expires_on)
       VALUES (1, ?, ?, ?, ?, ?)`,
      [employee_id, qualification, institution, issued_on, expires_on]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Qualification added' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get employee qualifications
router.get('/qualifications/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM employee_qualifications WHERE employee_id = ? AND deleted_at IS NULL ORDER BY issued_on DESC',
      [req.params.employeeId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
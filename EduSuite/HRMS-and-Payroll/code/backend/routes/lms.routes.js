// backend/routes/lms.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================
// COURSES
// ============================================================

// Create course
router.post('/courses', async (req, res) => {
  const { title, description, category, duration_hours, instructor, course_url, thumbnail_url, status = 'DRAFT' } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO courses 
       (org_id, title, description, category, duration_hours, instructor, course_url, thumbnail_url, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, category, duration_hours, instructor, course_url, thumbnail_url, status]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Course created' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM courses WHERE deleted_at IS NULL ORDER BY created_at DESC');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get course by ID
router.get('/courses/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM courses WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Course not found' } });
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Update course
router.put('/courses/:id', async (req, res) => {
  const { title, description, category, duration_hours, instructor, course_url, thumbnail_url, status } = req.body;
  try {
    await db.query(
      `UPDATE courses SET title = ?, description = ?, category = ?, duration_hours = ?, instructor = ?, course_url = ?, thumbnail_url = ?, status = ? WHERE id = ? AND deleted_at IS NULL`,
      [title, description, category, duration_hours, instructor, course_url, thumbnail_url, status, req.params.id]
    );
    res.json({ meta: { message: 'Course updated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Delete course
router.delete('/courses/:id', async (req, res) => {
  try {
    await db.query('UPDATE courses SET deleted_at = NOW(3) WHERE id = ?', [req.params.id]);
    res.json({ meta: { message: 'Course deleted' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// ENROLLMENTS
// ============================================================

// Enroll employee
router.post('/enroll', async (req, res) => {
  const { employee_id, course_id } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT id FROM enrollments WHERE employee_id = ? AND course_id = ? AND deleted_at IS NULL',
      [employee_id, course_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: { message: 'Already enrolled' } });
    }
    const [result] = await db.query(
      `INSERT INTO enrollments (org_id, employee_id, course_id, status) VALUES (1, ?, ?, 'NOT_STARTED')`,
      [employee_id, course_id]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Enrolled successfully' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get employee enrollments
router.get('/enrollments/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, c.title as course_title, c.thumbnail_url 
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.employee_id = ? AND e.deleted_at IS NULL
       ORDER BY e.enrolled_at DESC`,
      [req.params.employeeId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Update progress
router.put('/enrollments/:id/progress', async (req, res) => {
  const { progress, status } = req.body;
  try {
    const completedAt = status === 'COMPLETED' ? 'NOW(3)' : 'NULL';
    await db.query(
      `UPDATE enrollments SET progress = ?, status = ?, completed_at = ${completedAt} WHERE id = ? AND deleted_at IS NULL`,
      [progress, status, req.params.id]
    );
    res.json({ meta: { message: 'Progress updated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// COURSE MODULES
// ============================================================

// Add module to course
router.post('/modules', async (req, res) => {
  const { course_id, module_title, module_description, module_order, video_url, duration_minutes } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO course_modules 
       (org_id, course_id, module_title, module_description, module_order, video_url, duration_minutes)
       VALUES (1, ?, ?, ?, ?, ?, ?)`,
      [course_id, module_title, module_description, module_order, video_url, duration_minutes]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Module added' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get course modules
router.get('/modules/:courseId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM course_modules WHERE course_id = ? AND deleted_at IS NULL ORDER BY module_order',
      [req.params.courseId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
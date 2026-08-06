// backend/routes/employee.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================
// 1. GET ALL EMPLOYEES
// ============================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM employees WHERE deleted_at IS NULL ORDER BY id DESC'
    );
    res.json({
      data: rows,
      meta: { total: rows.length }
    });
  } catch (error) {
    console.error('GET /employees error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 2. GET EMPLOYEE BY ID
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM employees WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('GET /employees/:id error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 3. CREATE EMPLOYEE (FIXED)
// ============================================================
router.post('/', async (req, res) => {
  console.log('📥 Received POST /employees:', req.body);

  const { employee_code, first_name, last_name, email, phone, date_of_joining, designation, department } = req.body;

  // Validation
  if (!employee_code) {
    return res.status(400).json({ error: { message: 'Employee code is required' } });
  }
  if (!first_name) {
    return res.status(400).json({ error: { message: 'First name is required' } });
  }
  if (!email) {
    return res.status(400).json({ error: { message: 'Email is required' } });
  }
  if (!date_of_joining) {
    return res.status(400).json({ error: { message: 'Date of joining is required' } });
  }

  try {
    // Check if employee code already exists
    const [existing] = await db.query(
      'SELECT id FROM employees WHERE employee_code = ? AND deleted_at IS NULL',
      [employee_code]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: { message: 'Employee code already exists' }
      });
    }

    // Insert employee (org_id will use DEFAULT 1)
    const [result] = await db.query(
      `INSERT INTO employees 
      (employee_code, first_name, last_name, email, phone, date_of_joining, designation, department) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_code, first_name, last_name || null, email, phone || null, date_of_joining, designation || null, department || null]
    );

    console.log('✅ Employee created with ID:', result.insertId);

    res.status(201).json({
      data: { id: result.insertId, ...req.body },
      meta: { message: 'Employee created successfully' }
    });
  } catch (error) {
    console.error('❌ POST /employees error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 4. UPDATE EMPLOYEE
// ============================================================
router.put('/:id', async (req, res) => {
  const { first_name, last_name, email, phone, designation, department } = req.body;
  try {
    const [result] = await db.query(
      `UPDATE employees 
       SET first_name = ?, last_name = ?, email = ?, phone = ?, 
           designation = ?, department = ?, updated_at = NOW(3)
       WHERE id = ? AND deleted_at IS NULL`,
      [first_name, last_name, email, phone, designation, department, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }
    res.json({ meta: { message: 'Employee updated successfully' } });
  } catch (error) {
    console.error('PUT /employees/:id error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 5. DELETE EMPLOYEE (SOFT DELETE)
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE employees SET deleted_at = NOW(3) WHERE id = ? AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }
    res.json({ meta: { message: 'Employee deleted successfully' } });
  } catch (error) {
    console.error('DELETE /employees/:id error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
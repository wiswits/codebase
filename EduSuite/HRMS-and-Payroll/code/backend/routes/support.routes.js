// backend/routes/support.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================
// TICKETS
// ============================================================

// Create ticket
router.post('/tickets', async (req, res) => {
  const { employee_id, subject, message, category, priority = 'MEDIUM' } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO support_tickets 
       (org_id, employee_id, subject, message, category, priority, status)
       VALUES (1, ?, ?, ?, ?, ?, 'OPEN')`,
      [employee_id, subject, message, category, priority]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Ticket created' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get employee tickets
router.get('/tickets/:employeeId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM support_tickets WHERE employee_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [req.params.employeeId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get all tickets (Admin)
router.get('/tickets/all', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name 
       FROM support_tickets t
       JOIN employees e ON e.id = t.employee_id
       WHERE t.deleted_at IS NULL 
       ORDER BY 
         CASE WHEN t.status = 'OPEN' THEN 1
              WHEN t.status = 'IN_PROGRESS' THEN 2
              WHEN t.status = 'RESOLVED' THEN 3
              ELSE 4 END, t.created_at DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Update ticket status
router.put('/tickets/:id/status', async (req, res) => {
  const { status, assigned_to } = req.body;
  try {
    const resolvedAt = status === 'RESOLVED' ? 'NOW(3)' : 'NULL';
    await db.query(
      `UPDATE support_tickets SET status = ?, assigned_to = ?, resolved_at = ${resolvedAt} WHERE id = ? AND deleted_at IS NULL`,
      [status, assigned_to, req.params.id]
    );
    res.json({ meta: { message: 'Ticket updated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// REPLIES
// ============================================================

// Add reply
router.post('/replies', async (req, res) => {
  const { ticket_id, employee_id, message, is_internal = false } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO ticket_replies (org_id, ticket_id, employee_id, message, is_internal)
       VALUES (1, ?, ?, ?, ?)`,
      [ticket_id, employee_id, message, is_internal]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Reply added' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get ticket replies
router.get('/replies/:ticketId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
       FROM ticket_replies r
       JOIN employees e ON e.id = r.employee_id
       WHERE r.ticket_id = ? AND r.deleted_at IS NULL
       ORDER BY r.created_at ASC`,
      [req.params.ticketId]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
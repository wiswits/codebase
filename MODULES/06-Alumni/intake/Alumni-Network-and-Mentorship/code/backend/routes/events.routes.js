const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Create event
router.post('/', auth, async (req, res) => {
  const { title, description, event_date, event_time, venue, capacity, type, status } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO events (org_id, title, description, event_date, event_time, venue, capacity, type, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, event_date, event_time, venue, capacity || 50, type || 'MEETUP', status || 'UPCOMING']
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Event created' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get all events
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM events WHERE deleted_at IS NULL ORDER BY event_date ASC'
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get event by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM events WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Event not found' } });
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  const { title, description, event_date, event_time, venue, capacity, type, status } = req.body;
  try {
    await db.query(
      `UPDATE events SET title = ?, description = ?, event_date = ?, event_time = ?, venue = ?, capacity = ?, type = ?, status = ? WHERE id = ? AND deleted_at IS NULL`,
      [title, description, event_date, event_time, venue, capacity, type, status, req.params.id]
    );
    res.json({ meta: { message: 'Event updated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('UPDATE events SET deleted_at = NOW(3) WHERE id = ?', [req.params.id]);
    res.json({ meta: { message: 'Event deleted' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
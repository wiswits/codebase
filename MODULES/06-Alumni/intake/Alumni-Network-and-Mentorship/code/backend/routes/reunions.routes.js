const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// ============================================================
// 1. CREATE REUNION
// ============================================================
router.post('/', auth, async (req, res) => {
  const { batch_year, name, description, event_date, venue, organizer_id, status } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO reunions (org_id, batch_year, name, description, event_date, venue, organizer_id, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
      [batch_year, name, description, event_date, venue, organizer_id, status || 'PLANNING']
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Reunion created' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 2. GET ALL REUNIONS
// ============================================================
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.full_name as organizer_name 
       FROM reunions r
       JOIN users u ON u.id = r.organizer_id
       WHERE r.deleted_at IS NULL
       ORDER BY r.event_date ASC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 3. GET REUNION BY ID
// ============================================================
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM reunions WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Reunion not found' } });
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 4. RSVP
// ============================================================
router.post('/:id/rsvp', auth, async (req, res) => {
  const { alumni_id, status, guests_count } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT id FROM reunion_rsvps WHERE reunion_id = ? AND alumni_id = ?',
      [req.params.id, alumni_id]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE reunion_rsvps SET status = ?, guests_count = ? WHERE id = ?',
        [status, guests_count || 0, existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO reunion_rsvps (org_id, reunion_id, alumni_id, status, guests_count)
         VALUES (1, ?, ?, ?, ?)`,
        [req.params.id, alumni_id, status, guests_count || 0]
      );
    }

    res.json({ meta: { message: 'RSVP updated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 5. GET RSVPS FOR REUNION
// ============================================================
router.get('/:id/rsvps', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT rr.*, u.full_name, u.email 
       FROM reunion_rsvps rr
       JOIN users u ON u.id = rr.alumni_id
       WHERE rr.reunion_id = ? AND rr.deleted_at IS NULL
       ORDER BY rr.created_at DESC`,
      [req.params.id]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 6. ADD REUNION PHOTO
// ============================================================
router.post('/:id/photos', auth, async (req, res) => {
  const { photo_url, caption, uploaded_by } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO reunion_photos (org_id, reunion_id, photo_url, caption, uploaded_by)
       VALUES (1, ?, ?, ?, ?)`,
      [req.params.id, photo_url, caption, uploaded_by]
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Photo added' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 7. GET REUNION PHOTOS
// ============================================================
router.get('/:id/photos', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT rp.*, u.full_name as uploaded_by_name 
       FROM reunion_photos rp
       JOIN users u ON u.id = rp.uploaded_by
       WHERE rp.reunion_id = ? AND rp.deleted_at IS NULL
       ORDER BY rp.created_at DESC`,
      [req.params.id]
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 8. DELETE REUNION
// ============================================================
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('UPDATE reunions SET deleted_at = NOW(3) WHERE id = ?', [req.params.id]);
    res.json({ meta: { message: 'Reunion deleted' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
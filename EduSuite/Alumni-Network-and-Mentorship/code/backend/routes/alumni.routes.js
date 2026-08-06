const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// ============================================================
// 1. GET ALUMNI PROFILE
// ============================================================
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.*, ap.batch_year, ap.course, ap.current_company, ap.designation, 
              ap.industry, ap.city, ap.country, ap.bio, ap.linkedin_url, ap.website_url,
              ap.verification_status, ap.is_graduated, ap.graduation_date,
              ps.visibility_level, ps.show_email, ps.show_phone
       FROM users u
       LEFT JOIN alumni_profiles ap ON ap.user_id = u.id
       LEFT JOIN privacy_settings ps ON ps.user_id = u.id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [req.params.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 2. CREATE/UPDATE ALUMNI PROFILE
// ============================================================
router.post('/profile', auth, async (req, res) => {
  const { user_id, batch_year, course, current_company, designation, industry, city, country, bio, linkedin_url, website_url } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM alumni_profiles WHERE user_id = ?', [user_id]);
    let result;

    if (existing.length > 0) {
      await db.query(
        `UPDATE alumni_profiles SET batch_year = ?, course = ?, current_company = ?, designation = ?, industry = ?, city = ?, country = ?, bio = ?, linkedin_url = ?, website_url = ? WHERE user_id = ?`,
        [batch_year, course, current_company, designation, industry, city, country, bio, linkedin_url, website_url, user_id]
      );
      result = { insertId: existing[0].id };
    } else {
      [result] = await db.query(
        `INSERT INTO alumni_profiles (org_id, user_id, batch_year, course, current_company, designation, industry, city, country, bio, linkedin_url, website_url)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, batch_year, course, current_company, designation, industry, city, country, bio, linkedin_url, website_url]
      );
    }

    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Profile saved successfully' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 3. AUTO-CREATE ALUMNI
// ============================================================
router.post('/auto-create', auth, async (req, res) => {
  const { user_id, graduation_date } = req.body;

  try {
    await db.query(
      `UPDATE alumni_profiles SET is_graduated = TRUE, graduation_date = ?, verification_status = 'PENDING' WHERE user_id = ?`,
      [graduation_date, user_id]
    );
    res.json({ meta: { message: 'Alumni profile activated successfully' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 4. VERIFY ALUMNI
// ============================================================
router.put('/:id/verify', auth, async (req, res) => {
  const { verified_by } = req.body;
  try {
    await db.query(
      `UPDATE alumni_profiles SET verification_status = 'VERIFIED', verified_by = ?, verified_at = NOW(3) WHERE id = ?`,
      [verified_by, req.params.id]
    );
    res.json({ meta: { message: 'Alumni verified successfully' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 5. DIRECTORY SEARCH (FIXED)
// ============================================================
router.get('/directory', auth, async (req, res) => {
  const { batch, city, industry, company, course, search } = req.query;

  try {
    let query = `
      SELECT u.id, u.full_name, u.email, u.avatar_url,
             ap.batch_year, ap.course, ap.current_company, ap.designation,
             ap.industry, ap.city, ap.country, ap.verification_status,
             ps.visibility_level
      FROM users u
      JOIN alumni_profiles ap ON ap.user_id = u.id
      LEFT JOIN privacy_settings ps ON ps.user_id = u.id
      WHERE u.role = 'ALUMNI' AND u.deleted_at IS NULL
    `;

    const params = [];

    if (batch) {
      query += ` AND ap.batch_year = ?`;
      params.push(batch);
    }
    if (city) {
      query += ` AND ap.city LIKE ?`;
      params.push(`%${city}%`);
    }
    if (industry) {
      query += ` AND ap.industry LIKE ?`;
      params.push(`%${industry}%`);
    }
    if (company) {
      query += ` AND ap.current_company LIKE ?`;
      params.push(`%${company}%`);
    }
    if (course) {
      query += ` AND ap.course LIKE ?`;
      params.push(`%${course}%`);
    }
    if (search) {
      query += ` AND (u.full_name LIKE ? OR ap.current_company LIKE ? OR ap.industry LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Privacy filter: Only show public profiles
    query += ` AND (ps.visibility_level = 'PUBLIC' OR ps.visibility_level IS NULL)`;
    query += ` ORDER BY u.created_at DESC`;

    const [rows] = await db.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 6. PRIVACY SETTINGS
// ============================================================
router.put('/privacy', auth, async (req, res) => {
  const { user_id, visibility_level, show_email, show_phone } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM privacy_settings WHERE user_id = ?', [user_id]);

    if (existing.length > 0) {
      await db.query(
        `UPDATE privacy_settings SET visibility_level = ?, show_email = ?, show_phone = ? WHERE user_id = ?`,
        [visibility_level, show_email, show_phone, user_id]
      );
    } else {
      await db.query(
        `INSERT INTO privacy_settings (org_id, user_id, visibility_level, show_email, show_phone) VALUES (1, ?, ?, ?, ?)`,
        [user_id, visibility_level, show_email, show_phone]
      );
    }

    res.json({ meta: { message: 'Privacy settings updated' } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
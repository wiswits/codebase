const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Bulk import alumni
router.post('/', auth, async (req, res) => {
  const { alumni_data, imported_by } = req.body;

  let success = 0;
  let failed = 0;
  const logs = [];

  try {
    for (const record of alumni_data) {
      try {
        // Check if user exists
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [record.email]);
        let user_id;

        if (existing.length > 0) {
          user_id = existing[0].id;
          logs.push(`User ${record.email} already exists, skipping...`);
        } else {
          // Create user
          const [userResult] = await db.query(
            `INSERT INTO users (org_id, email, password_hash, full_name, role) 
             VALUES (1, ?, '$2a$10$defaultHash', ?, 'ALUMNI')`,
            [record.email, record.full_name]
          );
          user_id = userResult.insertId;
          logs.push(`User ${record.full_name} created successfully`);
        }

        // Check if alumni profile exists
        const [existingProfile] = await db.query('SELECT id FROM alumni_profiles WHERE user_id = ?', [user_id]);

        if (existingProfile.length > 0) {
          logs.push(`Profile for ${record.full_name} already exists, skipping...`);
        } else {
          await db.query(
            `INSERT INTO alumni_profiles (org_id, user_id, batch_year, course, current_company, designation, industry, city, verification_status)
             VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, record.batch_year, record.course, record.current_company, record.designation, record.industry, record.city, 'PENDING']
          );
          logs.push(`Profile for ${record.full_name} created successfully`);
          success++;
        }
      } catch (error) {
        failed++;
        logs.push(`❌ Error for ${record.email}: ${error.message}`);
      }
    }

    // Save import log
    const [result] = await db.query(
      `INSERT INTO import_logs (org_id, file_name, total_records, success_records, failed_records, logs, imported_by)
       VALUES (1, 'Manual Import', ?, ?, ?, ?, ?)`,
      [alumni_data.length, success, failed, logs.join('\n'), imported_by]
    );

    res.status(201).json({
      data: { log_id: result.insertId, success, failed },
      meta: { message: `Import completed: ${success} successful, ${failed} failed` }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get import logs
router.get('/logs', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, u.full_name as imported_by_name 
       FROM import_logs l
       JOIN users u ON u.id = l.imported_by
       WHERE l.deleted_at IS NULL
       ORDER BY l.created_at DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get import log by ID
router.get('/logs/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM import_logs WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Import log not found' } });
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
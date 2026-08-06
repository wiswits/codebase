// backend/routes/asset.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================
// CREATE ASSET
// ============================================================
router.post('/assets', async (req, res) => {
  const { asset_code, name, category, serial_number, purchase_date, purchase_price, assigned_to, status } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO assets (org_id, asset_code, name, category, serial_number, purchase_date, purchase_price, assigned_to, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [asset_code, name, category, serial_number, purchase_date, purchase_price, assigned_to, status || 'AVAILABLE']
    );
    res.status(201).json({ data: { id: result.insertId }, meta: { message: 'Asset created successfully' } });
  } catch (error) {
    console.error('POST /assets error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// GET ALL ASSETS
// ============================================================
router.get('/assets', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, CONCAT(e.first_name, ' ', e.last_name) as assigned_to_name
       FROM assets a
       LEFT JOIN employees e ON e.id = a.assigned_to
       WHERE a.deleted_at IS NULL ORDER BY a.created_at DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('GET /assets error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// GET ASSET BY ID
// ============================================================
router.get('/assets/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM assets WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: { message: 'Asset not found' } });
    }
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('GET /assets/:id error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// UPDATE ASSET
// ============================================================
router.put('/assets/:id', async (req, res) => {
  const { name, category, serial_number, purchase_date, purchase_price, status } = req.body;
  try {
    const [result] = await db.query(
      `UPDATE assets SET name = ?, category = ?, serial_number = ?, purchase_date = ?, purchase_price = ?, status = ? WHERE id = ? AND deleted_at IS NULL`,
      [name, category, serial_number, purchase_date, purchase_price, status, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Asset not found' } });
    }
    res.json({ meta: { message: 'Asset updated successfully' } });
  } catch (error) {
    console.error('PUT /assets/:id error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// ASSIGN ASSET TO EMPLOYEE
// ============================================================
router.put('/assets/:id/assign', async (req, res) => {
  const { assigned_to } = req.body;
  try {
    const [result] = await db.query(
      `UPDATE assets SET assigned_to = ?, status = 'ASSIGNED' WHERE id = ? AND deleted_at IS NULL`,
      [assigned_to, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Asset not found' } });
    }
    res.json({ meta: { message: 'Asset assigned successfully' } });
  } catch (error) {
    console.error('PUT /assets/:id/assign error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// DELETE ASSET (SOFT DELETE)
// ============================================================
router.delete('/assets/:id', async (req, res) => {
  try {
    const [result] = await db.query('UPDATE assets SET deleted_at = NOW(3) WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Asset not found' } });
    }
    res.json({ meta: { message: 'Asset deleted successfully' } });
  } catch (error) {
    console.error('DELETE /assets/:id error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
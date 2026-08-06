'use strict';
const path = require('path');
const fs   = require('fs');
const db   = require('../../config/db');
const { pruneMissingUploads } = require('../../utils/uploadPath');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../../uploads/org-logos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `org-${req.user.org_id}-${Date.now()}${ext}`);
  }
});

exports.uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/svg+xml','image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
}).single('logo');

// ── helper: fetch full branding row ──────────────────────────────────────────
async function getOrgBranding(orgId) {
  const [[row]] = await db.pool.execute(
    `SELECT id, name, display_name, slug, org_code, logo_url, tagline,
            brand_color, primary_color, secondary_color, platform_name,
            type, city, state, country, phone
     FROM client_organizations WHERE id = ?`, [orgId]
  );
  // A logo_url whose file no longer exists must not be advertised — otherwise
  // every page of every role fires one 404 for it. Serve null → initials avatar.
  return row ? pruneMissingUploads(row, ['logo_url']) : null;
}

// GET /api/org/branding  — all roles can read their org branding
exports.getBranding = async (req, res) => {
  try {
    const org = await getOrgBranding(req.user.org_id);
    if (!org) return res.status(404).json({ success: false, message: 'Org not found' });
    res.json({ success: true, data: org });
  } catch (e) {
    console.error('getBranding error:', e.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/org/branding  — admin only
exports.updateBranding = async (req, res) => {
  try {
    const { display_name, tagline, brand_color, platform_name } = req.body;
    const fields = [];
    const vals   = [];
    if (display_name  !== undefined) { fields.push('display_name=?');  vals.push(display_name.trim().slice(0,100)); }
    if (tagline       !== undefined) { fields.push('tagline=?');        vals.push(tagline.trim().slice(0,255)); }
    if (brand_color   !== undefined) { fields.push('brand_color=?');    vals.push(brand_color.slice(0,20)); }
    if (platform_name !== undefined) { fields.push('platform_name=?');  vals.push(platform_name.trim().slice(0,255)); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
    vals.push(req.user.org_id);
    await db.pool.execute(`UPDATE client_organizations SET ${fields.join(',')} WHERE id=?`, vals);
    const org = await getOrgBranding(req.user.org_id);
    res.json({ success: true, message: 'Branding updated', data: org });
  } catch (e) {
    console.error('updateBranding error:', e.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/org/upload-logo  — admin only
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const logoPath = `/uploads/org-logos/${req.file.filename}`;
    // delete old file
    const [[old]] = await db.pool.execute('SELECT logo_url FROM client_organizations WHERE id=?', [req.user.org_id]);
    if (old && old.logo_url) {
      const oldFile = path.join(__dirname, '../../../', old.logo_url);
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }
    await db.pool.execute('UPDATE client_organizations SET logo_url=? WHERE id=?', [logoPath, req.user.org_id]);
    const org = await getOrgBranding(req.user.org_id);
    res.json({ success: true, message: 'Logo uploaded', data: org });
  } catch (e) {
    console.error('uploadLogo error:', e.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/org/logo  — admin only
exports.deleteLogo = async (req, res) => {
  try {
    const [[row]] = await db.pool.execute('SELECT logo_url FROM client_organizations WHERE id=?', [req.user.org_id]);
    if (row && row.logo_url) {
      const f = path.join(__dirname, '../../../', row.logo_url);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    await db.pool.execute('UPDATE client_organizations SET logo_url=NULL WHERE id=?', [req.user.org_id]);
    const org = await getOrgBranding(req.user.org_id);
    res.json({ success: true, message: 'Logo removed', data: org });
  } catch (e) {
    console.error('deleteLogo error:', e.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

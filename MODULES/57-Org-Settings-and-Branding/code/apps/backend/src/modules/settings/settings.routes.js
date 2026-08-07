const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const logger = require('../../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Logos must be PUBLICLY readable (they render in plain <img> tags, pre-login
// too), so they live under backend/uploads/branding which the /uploads static
// mount serves. Path resolves to the same dir server.js exposes at /uploads.
const BRAND_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'branding');
try { fs.mkdirSync(BRAND_DIR, { recursive: true }); } catch (e) { /* created on boot */ }
const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, BRAND_DIR),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname || '') || '.png').toLowerCase().replace(/[^.\w]/g, '');
      cb(null, `org${req.user.org_id}_${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  // SVG is intentionally NOT allowed: an SVG can carry <script> and, served
  // same-origin, becomes stored XSS. Raster logos only.
  fileFilter: (req, file, cb) => cb(null, ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)),
});

router.use(authenticate);

// Upload a brand logo → stored public, persisted on the org, URL returned.
router.post('/logo', requireRole('owner', 'admin', 'principal'), logoUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return error(res, 'Upload a PNG/JPG/WEBP/SVG logo (≤5MB)', 400);
    const url = `/uploads/branding/${req.file.filename}`;
    await query('UPDATE client_organizations SET logo_url=? WHERE id=?', [url, req.user.org_id]);
    return success(res, { url, logo_url: url }, 'Logo uploaded', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// Get all settings (org info, branding, notification prefs)
router.get('/', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;

    const [org, prefs] = await Promise.all([
      queryOne(`SELECT id, name, slug, display_name, logo_url, tagline, brand_color,
        type, custom_domain, platform_name, email_from_name, email_from_address,
        timezone, primary_color, secondary_color
        FROM client_organizations WHERE id=?`, [o]),
      queryOne(`SELECT * FROM client_notification_prefs WHERE user_id=?`, [uid]).catch(()=>null)
    ]);

    return success(res, {
      organization: org || {},
      notifications: prefs || {
        email_enabled: 1, push_enabled: 1, sms_enabled: 0,
        announcements: 1, attendance: 1, fees: 1, quizzes: 1
      }
    });
  } catch (e) { logger.error('Settings get:', e); return error(res, e.message, 500); }
});

// Branding (gets org branding)
router.get('/branding', async (req, res) => {
  try {
    const o = req.user.org_id;
    const branding = await queryOne(`SELECT id, name, display_name, logo_url, tagline,
      brand_color, primary_color, secondary_color, custom_domain, platform_name
      FROM client_organizations WHERE id=?`, [o]);
    return success(res, branding || {});
  } catch (e) { return error(res, e.message, 500); }
});

// Update branding
router.put('/branding', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { display_name, logo_url, tagline, brand_color, primary_color, secondary_color,
      platform_name, custom_domain, email_from_name, email_from_address } = req.body;
    await query(`UPDATE client_organizations SET
      display_name=COALESCE(?,display_name), logo_url=COALESCE(?,logo_url),
      tagline=COALESCE(?,tagline), brand_color=COALESCE(?,brand_color),
      primary_color=COALESCE(?,primary_color), secondary_color=COALESCE(?,secondary_color),
      platform_name=COALESCE(?,platform_name), custom_domain=COALESCE(?,custom_domain),
      email_from_name=COALESCE(?,email_from_name), email_from_address=COALESCE(?,email_from_address)
      WHERE id=?`, [
        display_name ?? null, logo_url ?? null, tagline ?? null, brand_color ?? null,
        primary_color ?? null, secondary_color ?? null, platform_name ?? null,
        custom_domain ?? null, email_from_name ?? null, email_from_address ?? null, o]);
    return success(res, {}, 'Branding updated');
  } catch (e) { return error(res, e.message, 500); }
});

// Update notification preferences
router.put('/notifications', async (req, res) => {
  try {
    const uid = req.user.user_id;
    const o = req.user.org_id;
    const { email_enabled, push_enabled, sms_enabled, announcements, attendance, fees, quizzes } = req.body;
    await query(`INSERT INTO client_notification_prefs
      (org_id, user_id, email_enabled, push_enabled, sms_enabled, announcements, attendance, fees, quizzes)
      VALUES (?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        email_enabled=VALUES(email_enabled), push_enabled=VALUES(push_enabled),
        sms_enabled=VALUES(sms_enabled), announcements=VALUES(announcements),
        attendance=VALUES(attendance), fees=VALUES(fees), quizzes=VALUES(quizzes)
    `, [o, uid, email_enabled?1:0, push_enabled?1:0, sms_enabled?1:0, announcements?1:0, attendance?1:0, fees?1:0, quizzes?1:0]).catch(()=>{});
    return success(res, {}, 'Notification preferences updated');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;

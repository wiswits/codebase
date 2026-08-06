'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./org.controller');
const { authenticate } = require('../../middleware/auth');

const adminOnly = (req, res, next) => {
  const role = req.user.role_slug || req.user.role;
  if (!['admin', 'sub_admin', 'principal', 'super_admin', 'system_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

router.use(authenticate);

// Basic org info (merged from the former clients/org stub — response shape,
// including the swallow-errors-as-success behavior, kept identical for now).
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { queryOne } = require('../../config/db');
    const org = await queryOne(
      'SELECT id, name, slug, logo_url, primary_color, secondary_color, custom_domain, platform_name, timezone FROM client_organizations WHERE id = ?',
      [orgId]
    );
    return res.json({ status: 'success', data: org || {} });
  } catch (e) {
    return res.json({ status: 'success', data: {} });
  }
});

router.get('/branding',     ctrl.getBranding);
router.patch('/branding',   adminOnly, ctrl.updateBranding);
router.post('/upload-logo', adminOnly, ctrl.uploadMiddleware, ctrl.uploadLogo);
router.delete('/logo',      adminOnly, ctrl.deleteLogo);

module.exports = router;

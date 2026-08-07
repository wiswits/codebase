'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./plans.controller');
const { authenticate } = require('../../middleware/auth');

// pricing_plans are GLOBAL (every tenant sees them). Writing them is a platform
// action — role AND membership of the WisWits platform org (org 1). A client
// school's seeded `owner` role must never CRUD global plans.
const PLATFORM_ORG_ID = parseInt(process.env.PLATFORM_ORG_ID || '1', 10);
const superAdminOnly = (req, res, next) => {
  const role = req.user.role_slug || req.user.role;
  if (!['super_admin', 'system_admin', 'owner'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }
  if (req.user.org_id !== PLATFORM_ORG_ID) {
    return res.status(403).json({ success: false, message: 'Platform access is restricted to WisWits' });
  }
  next();
};

// Public — list active plans (for signup/pricing page)
router.get('/public', ctrl.listPublic);

// Logged-in user — get my org's subscription
router.get('/my-subscription', authenticate, ctrl.mySubscription);

// Superadmin — platform architecture overview + bundle preview (Phase 5, read-only)
router.get('/architecture', authenticate, superAdminOnly, ctrl.architecture);
router.get('/bundle-preview', authenticate, superAdminOnly, ctrl.bundlePreview);

// Owner only — manage plans
router.get('/',    authenticate, superAdminOnly, ctrl.listAll);
router.post('/',   authenticate, superAdminOnly, ctrl.create);
router.patch('/:id', authenticate, superAdminOnly, ctrl.update);
router.delete('/:id', authenticate, superAdminOnly, ctrl.remove);

module.exports = router;

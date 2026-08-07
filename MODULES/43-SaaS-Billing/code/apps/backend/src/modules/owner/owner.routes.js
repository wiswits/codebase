'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('./owner.controller');
const { authenticate } = require('../../middleware/auth');

// Platform endpoints (cross-tenant stats, onboarding, master-login) belong to
// the WISWITS platform org ONLY. A client school's 'owner' role must NEVER
// reach these — tenant isolation is role AND platform-org membership.
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

router.use(authenticate, superAdminOnly);

router.get('/stats',                  ctrl.stats);
router.get('/tenants',                ctrl.tenants);
router.get('/leads',                  ctrl.leads);
router.post('/leads/:id/activate',    ctrl.activateLead);
router.post('/onboard',               ctrl.onboardOrg);
router.get('/tenants/:id',            ctrl.tenantDetail);
router.patch('/tenants/:id',          ctrl.updateTenant);
router.delete('/tenants/:id',         ctrl.deleteTenant);
router.post('/master-login',          ctrl.masterLogin);
// end-impersonation existed as a controller function but was never wired to
// a route — every session it should have closed stayed "Active" forever
// (duration_seconds also never got computed, so Duration always read "—").
router.post('/end-impersonation',     ctrl.endImpersonation);
router.get('/impersonation-logs',     ctrl.impersonationLogs);
router.get('/platform-users',         ctrl.platformUsers);
router.get('/revenue',                ctrl.revenue);
router.get('/analytics',              ctrl.analyticsData);
// Who is trying to sign in to a school we have locked — the renewal call list.
router.get('/renewal-pressure',       ctrl.renewalPressure);
// The audit trail, read across every tenant: what is happening, and how often.
router.get('/activity',               ctrl.activity);

// ── GST REGISTRATION WATCH ───────────────────────────────────────────────────
// Money actually received this financial year against the threshold being watched, so
// that it is never crossed quietly. Read-only; it writes no money row. Both inherit the
// platform-org + role guard applied above — a customer's admin holds an elevated
// base_role and must never reach WisWits' own revenue.
const turnoverCtrl = require('./turnover.controller');
router.get('/turnover',               turnoverCtrl.turnover);
router.patch('/turnover/threshold',   turnoverCtrl.setThreshold);

module.exports = router;

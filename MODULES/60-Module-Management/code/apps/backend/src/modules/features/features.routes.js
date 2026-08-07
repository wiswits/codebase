const express = require('express');
const router = express.Router();
const ctrl = require('./features.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole, requirePermission, requirePlatformOrg } = require('../../middleware/rbac');

// Question Bank library grants — platform side only. A school must not be able
// to grant itself read access to WisWits' master bank, so these sit behind
// requirePlatformOrg like every other org-targeting switch in this file.
router.get('/qbank-library', authenticate, requirePlatformOrg, requireRole('owner','super_admin','system_admin'), ctrl.listQbankLibrary);
router.post('/qbank-library', authenticate, requirePlatformOrg, requireRole('owner','super_admin','system_admin'), ctrl.setQbankLibrary);

router.get('/my', authenticate, ctrl.myFeatures);
router.get('/all', authenticate, ctrl.allFeatures);
router.post('/toggle', authenticate, requirePermission('features.manage'), ctrl.toggleFeature);
// Admin SELF-SERVE modules (PERSONA_BLUEPRINT_MAP §5) — the org's own admin/owner
// turns modules on/off for THEIR org (org-scoped write, plan-gated, core-locked).
// Not a platform surface: any org, gated by features.manage (admin/owner auto-pass).
router.get('/my-modules', authenticate, requirePermission('features.manage'), ctrl.myModules);
router.post('/my-modules/toggle', authenticate, requirePermission('features.manage'), ctrl.toggleMyModule);
// Governance (CONTROL_PLANE §4): admin reads their own self-serve rights; owner sets them.
router.get('/governance', authenticate, ctrl.myGovernance);
router.get('/governance/org', authenticate, requirePlatformOrg, requireRole('owner','super_admin','system_admin'), ctrl.orgGovernance);
router.post('/governance', authenticate, requirePlatformOrg, requireRole('owner','super_admin','system_admin'), ctrl.setGovernance);
// Platform-GLOBAL / cross-tenant surfaces — role AND platform-org (org 1) only.
// A client school's own `owner` role must never mutate global feature state or
// read every tenant's flags.
router.post('/update-status', authenticate, requirePlatformOrg, requireRole('owner','super_admin','system_admin'), ctrl.updateStatus);
router.post('/create', authenticate, requirePlatformOrg, requireRole('owner','super_admin','system_admin'), ctrl.createFeature);
// Feature Lifecycle Pipeline (SUG-0076) — superadmin cockpit + pilot push
router.get('/whats-new', authenticate, ctrl.whatsNew);
router.get('/registry', authenticate, requirePlatformOrg, requireRole('owner','super_admin','system_admin'), ctrl.registry);
router.post('/pilot', authenticate, requirePlatformOrg, requireRole('owner','super_admin','system_admin'), ctrl.pilotPush);
// Add-on Manager (FEATURE_FLAGS_SPEC §3) — grant a module to all/plan/org-type/org
router.get('/addons', authenticate, requirePlatformOrg, requireRole('owner','super_admin','system_admin'), ctrl.addons);
router.post('/addon-grant', authenticate, requirePlatformOrg, requireRole('owner','super_admin','system_admin'), ctrl.addonGrant);

module.exports = router;

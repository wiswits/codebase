'use strict';
/**
 * PRICING ROUTES — the owner's control plane, plus one read-only customer view.
 *
 * EVERY write is `requirePlatformOrg` + `requireRole('owner','super_admin','system_admin')`.
 * Role alone is not enough: a customer's seeded `admin` maps to an elevated base_role
 * that auto-passes permission checks, so without the platform-org check a school admin
 * could reach a route that sets their own price. The org check is what makes the
 * hierarchy asymmetric — WisWits sets the school's price, the school reads it.
 *
 * `/my-pack` is the only route a customer may call, and it is a GET.
 */
const express = require('express');
const router = express.Router();
const ctrl = require('./pricing.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole, requirePlatformOrg } = require('../../middleware/rbac');

const ownerOnly = [authenticate, requirePlatformOrg, requireRole('owner', 'super_admin', 'system_admin')];

// ── the customer's own view — read-only, any authenticated member of the org ──
router.get('/my-pack', authenticate, ctrl.myPack);

// ── the catalog ──────────────────────────────────────────────────────────────
router.get('/catalog', ...ownerOnly, ctrl.getCatalog);

// ── plan price and plan composition ──────────────────────────────────────────
router.patch('/plans/:id', ...ownerOnly, ctrl.updatePlan);
router.put('/plans/:slug/modules', ...ownerOnly, ctrl.setPlanModules);
// The ONLY route that turns a computed suggestion into a real price. Deliberately a
// POST with no body: accepting is an act, not an edit — see the controller.
router.post('/plans/:id/accept-suggested', ...ownerOnly, ctrl.acceptSuggested);

// ── the volume curve ─────────────────────────────────────────────────────────
// The whole curve at once. A band edited in isolation is how a gap or an overlap
// appears, and either means a headcount with no multiplier or two.
router.put('/slabs', ...ownerOnly, ctrl.setSlabs);

// ── module list prices ───────────────────────────────────────────────────────
router.put('/modules/:key', ...ownerOnly, ctrl.setModulePrice);

// ── the module registry ──────────────────────────────────────────────────────
// `POST /modules` must be declared before `PUT /modules/:key` reads as a conflict — it
// does not (different verbs), but keep them together so a future route with the same
// path is obvious. Nothing here DELETES: a module somebody pays for is retired, never
// removed (§15).
router.post('/modules', ...ownerOnly, ctrl.createModule);
router.patch('/modules/:key', ...ownerOnly, ctrl.updateModule);
router.post('/modules/:key/lifecycle', ...ownerOnly, ctrl.moduleLifecycle);

// ── meter rates (sell + our cost) ────────────────────────────────────────────
router.put('/meters/:key', ...ownerOnly, ctrl.setMeterRate);

// ── per-org: the resolved price, the override, the paid add-ons ──────────────
router.get('/orgs/:orgId', ...ownerOnly, ctrl.orgPrice);
router.put('/orgs/:orgId/override', ...ownerOnly, ctrl.setOverride);
router.put('/orgs/:orgId/addons/:key', ...ownerOnly, ctrl.setAddon);

// ── coupons ──────────────────────────────────────────────────────────────────
router.get('/coupons', ...ownerOnly, ctrl.listCoupons);
router.post('/coupons', ...ownerOnly, ctrl.createCoupon);
router.patch('/coupons/:id', ...ownerOnly, ctrl.updateCoupon);
router.post('/coupons/preview', ...ownerOnly, ctrl.previewCoupon);

// ── campaigns — the offer that matches by itself ─────────────────────────────
// Same `ownerOnly` stack as everything else here, and for the same reason: a customer's
// seeded `admin` maps to an elevated base_role that auto-passes permission checks, so
// role alone would let a school admin publish a 100%-off campaign for itself.
//
// `/simulate` is declared BEFORE `/:id` so a POST to it can never be read as an id, and
// it is the gate the rest of this section depends on — a campaign cannot be activated
// without one having been run against its current economics (see the controller).
// Nothing DELETEs: a campaign somebody has redeemed still has to explain an old invoice.
router.get('/campaigns', ...ownerOnly, ctrl.listCampaigns);
router.post('/campaigns/simulate', ...ownerOnly, ctrl.simulateCampaign);
router.post('/campaigns', ...ownerOnly, ctrl.createCampaign);
router.patch('/campaigns/:id', ...ownerOnly, ctrl.updateCampaign);
router.post('/campaigns/:id/activate', ...ownerOnly, ctrl.activateCampaign);
router.post('/campaigns/:id/deactivate', ...ownerOnly, ctrl.deactivateCampaign);

module.exports = router;

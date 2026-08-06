'use strict';
/*
 * invoices.routes.js — WisWits' own invoice ledger. Owner surface, nothing else.
 *
 * ── THE GUARD IS TWO HALVES AND BOTH ARE LOad-BEARING ───────────────────────
 * `requireRole('owner','super_admin','system_admin')` is NOT enough on its own, and
 * assuming otherwise is a live bug class in this repo. Every customer organisation is
 * seeded with a role whose slug is literally `owner` (base_role `admin`, is_system 1) —
 * so a school's own administrator passes a role check named `owner` and would land
 * inside WisWits' revenue.
 *
 * `requirePlatformOrg` is the half that actually keeps them out: platform access is role
 * AND membership of the WisWits platform org. This was verified by calling every route
 * below with a real customer-admin token over real HTTP, not by reading this comment —
 * see `scripts/prove_invoice_ledger.js`.
 *
 * Mounted from server.js BEFORE the `/api/owner` router. Express matches mounts in
 * registration order, and `/api/owner` applies its own `authenticate` first; mounting
 * after it would mean every request here paid for two JWT verifications and reported
 * failures from the wrong router.
 */

const express = require('express');
const router = express.Router();

const { authenticate } = require('../../middleware/auth');
const { requireRole, requirePlatformOrg } = require('../../middleware/rbac');
const ctrl = require('./invoices.controller');

router.use(authenticate, requireRole('owner', 'super_admin', 'system_admin'), requirePlatformOrg);

/* ── read ── */
// Static segments first: `/methods` and `/quote/...` would otherwise be swallowed by
// `/:id`, which Express matches by position and not by specificity.
router.get('/methods', ctrl.methods);
router.get('/quote/:orgId', ctrl.quote);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.get('/:id/attachment', ctrl.attachment);

/* ── write ── */
router.post('/', ctrl.create);
router.post('/import', ctrl.import);
router.post('/:id/payments', ctrl.recordPayment);

/*
 * There is deliberately no PUT, PATCH or DELETE on an invoice.
 *
 * An invoice is immutable once issued: its number, its amounts and its buyer snapshot
 * are what make it a document rather than a note. A correction is a credit note or a new
 * invoice. Offering an edit endpoint "just for typos" is how a ledger stops being
 * evidence — and the absence of the verb is a stronger guarantee than a rule in a doc.
 */

module.exports = router;

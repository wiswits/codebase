'use strict';
/**
 * /api/value-report — the school's own year in its own numbers.
 *
 * NO `.module.js` DESCRIPTOR ON PURPOSE. src/core/registry.js hard-fails at boot
 * on any discovered descriptor that is missing from MOUNT_ORDER, and MOUNT_ORDER
 * is owned elsewhere this session. A plain router mounted with one line in
 * server.js is the honest way to add this without a boot-breaking half-edit;
 * folding it into the registry is a one-line follow-up.
 *
 * PERMISSION — and this is NOT "any authenticated user".
 *
 * The headline figure is total fee collection for the WHOLE institution, next to
 * how many people signed in and how many messages went out. That is the same
 * institutional money conversation /api/billing gates, so it is gated by the
 * identical role list rather than a new one: one audience, one answer, and no
 * chance of the two drifting apart.
 *
 * `requirePermission('fees.view')` was tried first and is WRONG — proven, not
 * assumed. Every seeded student and parent role holds `fees.view`, because a
 * student must see their OWN fees; the permission is per-record and says nothing
 * about an institution-wide aggregate. Gated that way, student@demo.com and
 * parent@demo.com both got a 200 with the school's total collection in it. That
 * is the student-surface blind spot exactly: a check that looks right and is
 * only caught by calling the endpoint AS the student.
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const controller = require('./valuereport.controller');

// Deliberately the same list as billing.routes.js BILLING_ROLES — the report and
// the bill it justifies belong to the same people.
const VALUE_REPORT_ROLES = ['owner', 'admin', 'principal', 'super_admin', 'system_admin'];

router.get('/', authenticate, requireRole(...VALUE_REPORT_ROLES), controller.getValueReport);

module.exports = router;

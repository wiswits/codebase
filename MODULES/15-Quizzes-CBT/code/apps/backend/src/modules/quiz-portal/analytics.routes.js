const express = require('express');
const router = express.Router();
const ctrl = require('./analytics.controller');
const { authenticate } = require('../../middleware/auth');

const { requireModule }   = require('../../middleware/moduleGate');
router.use(authenticate);
// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('assessment'));
router.get('/teacher/overview', ctrl.teacherOverview);
router.get('/student/overview', ctrl.studentOverview);

module.exports = router;

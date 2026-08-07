const express = require('express');
const router = express.Router();
const ctrl = require('./attempt.controller');
const { authenticate } = require('../../middleware/auth');

const { requireModule }   = require('../../middleware/moduleGate');
router.use(authenticate);

// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('assessment'));
router.get('/my',                   ctrl.myAttempts);
router.get('/test/:id',             ctrl.getTestForAttempt);
router.post('/:attemptId/answer',   ctrl.saveAnswer);
router.post('/:attemptId/flag',     ctrl.toggleFlag);
router.post('/:attemptId/submit',   ctrl.submitAttempt);
router.get('/:attemptId/result',    ctrl.getResult);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('./bank.controller');
const { authenticate } = require('../../middleware/auth');
const { requireModule }   = require('../../middleware/moduleGate');
const { requirePermission } = require('../../middleware/rbac');

router.use(authenticate);

// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('assessment'));
// Question rows include correct_answer — this is a content-authoring surface
// for staff, not a student-facing one. Gated to quizzes.create (same pattern
// lms/quizzes.routes.js uses to stop an answer-key leak).
const staffOnly = requirePermission('quizzes.create');

router.get('/stats',                  ctrl.getStats);
router.get('/filters',                ctrl.getFilters);
router.get('/questions',              staffOnly, ctrl.listQuestions);
router.get('/questions/:id',          staffOnly, ctrl.getQuestion);
router.post('/questions',             staffOnly, ctrl.createQuestion);
router.patch('/questions/:id',        staffOnly, ctrl.updateQuestion);
router.delete('/questions/:id',       staffOnly, ctrl.deleteQuestion);
router.post('/questions/:id/like',    ctrl.toggleLike);
router.post('/questions/:id/bookmark',ctrl.toggleBookmark);
router.post('/import-bulk',          staffOnly, ctrl.importBulk);

module.exports = router;

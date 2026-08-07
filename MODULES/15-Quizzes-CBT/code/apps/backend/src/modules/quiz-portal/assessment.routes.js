const express = require('express');
const router = express.Router();
const ctrl = require('./assessment.controller');
const { authenticate } = require('../../middleware/auth');
const { requireModule }   = require('../../middleware/moduleGate');
const { requirePermission } = require('../../middleware/rbac');

router.use(authenticate);

// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('assessment'));
// preview/tests/:id/duplicate all return correct_answer/solution — gated to
// quizzes.create (same pattern lms/quizzes.routes.js uses) so a student can't
// read or exfiltrate answer keys via these routes.
router.get('/types',     ctrl.listTestTypes);
router.get('/templates', ctrl.listTemplates);
// SECURITY FIX (QA round 4 backend audit): /templates and /publish carried NO
// authorization at all — only `authenticate`. Any logged-in user, INCLUDING a
// student or a parent, could POST /api/quiz-portal/assessment/publish and create
// a live test in their org (client_quizzes + questions, targeted at a section),
// or POST /templates to write quiz_test_templates rows. Every sibling
// answer-key route on this router was already gated on quizzes.create; these two
// — the only WRITE routes here — were simply missed. Gated identically now.
// Not a lockout risk: teachers hold quizzes.* and elevated roles auto-pass, so
// only student/parent lose access, and neither has any flow that publishes a test.
router.post('/templates',requirePermission('quizzes.create'), ctrl.saveTemplate);
router.post('/preview',  requirePermission('quizzes.create'), ctrl.previewTest);
router.post('/publish',  requirePermission('quizzes.create'), ctrl.publishTest);
router.get('/tests',                 ctrl.listTests);
router.get('/tests/:id',             requirePermission('quizzes.create'), ctrl.getTest);
router.delete('/tests/:id',          ctrl.deleteTest);
router.post('/tests/:id/duplicate',  requirePermission('quizzes.create'), ctrl.duplicateTest);

module.exports = router;

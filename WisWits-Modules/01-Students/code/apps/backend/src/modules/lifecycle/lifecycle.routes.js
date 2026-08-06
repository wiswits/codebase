const router = require('express').Router();
const ctrl = require('./lifecycle.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.post('/students/:id/lifecycle/transition', ctrl.transitionStatus);
router.get('/students/:id/lifecycle/history', ctrl.getHistory);
router.get('/students/:id/lifecycle/allowed', ctrl.getAllowedTransitions);
router.post('/leads/:id/convert-to-student', ctrl.convertLeadToStudent);

module.exports = router;

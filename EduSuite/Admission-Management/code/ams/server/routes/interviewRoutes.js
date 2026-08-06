const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/slots', ctrl.listSlots);
router.post('/slots/generate', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.generateSlots);
router.post('/slots', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.createSlotManually);
router.post('/book', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER, ROLES.COUNSELOR), ctrl.bookSlot);
router.get('/', ctrl.listInterviews);
router.get('/:id', ctrl.getInterview);
router.patch('/:id/score', authorize(ROLES.ADMIN, ROLES.PANELIST), ctrl.submitScore);
router.patch('/:id/no-show', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.markNoShow);

module.exports = router;

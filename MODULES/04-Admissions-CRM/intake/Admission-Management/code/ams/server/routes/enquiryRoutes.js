const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/enquiryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/board', ctrl.kanbanBoard);
router.get('/', ctrl.listEnquiries);
router.post('/', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER, ROLES.COUNSELOR), ctrl.createEnquiry);
router.patch('/:id/stage', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER, ROLES.COUNSELOR), ctrl.updateStage);
router.post('/:id/contact-log', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER, ROLES.COUNSELOR), ctrl.addContactLog);
router.patch('/:id/assign', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.assignCounselor);
router.patch('/:id/source', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.changeSource);

module.exports = router;

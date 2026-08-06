const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', ctrl.listApplications);
router.get('/:id', ctrl.getApplication);
router.patch('/:id/status', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.updateStatus);
router.patch('/:id/source', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.changeApplicationSource);

module.exports = router;

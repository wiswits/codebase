const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { ROLES } = require('../config/constants');
const { upload } = require('../middleware/upload');

router.use(protect);

router.get('/checklist/:classApplied', ctrl.getChecklist);
router.put('/checklist/:classApplied', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.setChecklist);
router.get('/verification-queue', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.verificationQueue);
router.get('/application/:applicationId', ctrl.listByApplication);
router.post('/:docId/upload', upload.single('file'), ctrl.uploadDocument);
router.patch('/:docId/verify', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.verifyDocument);

module.exports = router;

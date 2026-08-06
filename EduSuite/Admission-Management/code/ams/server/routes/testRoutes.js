const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/testController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { ROLES } = require('../config/constants');
const { uploadCsv } = require('../middleware/upload');

router.use(protect);

router.get('/', ctrl.listTests);
router.post('/', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.createTest);
router.post(
  '/:id/bulk-upload',
  authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER),
  uploadCsv.single('file'),
  ctrl.bulkUploadResults
);
router.get('/:id/results', ctrl.getResults);
router.patch('/results/:resultId/override', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.overrideCutoff);

module.exports = router;

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateReport } = require('../middleware/validation');

router.get('/', auth, checkPermission(['admin', 'hr', 'manager']), reportController.getReports);
router.get('/:id', auth, checkPermission(['admin', 'hr', 'manager']), reportController.getReportById);
router.post('/generate', auth, checkPermission(['admin', 'hr', 'manager']), validateReport, reportController.generateReport);
router.post('/daily', auth, reportController.submitDailyReport);

module.exports = router;
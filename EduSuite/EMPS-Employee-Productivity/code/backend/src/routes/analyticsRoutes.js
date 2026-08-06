const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

router.get('/admin', auth, checkPermission(['admin']), analyticsController.getAdminAnalytics);
router.get('/employee', auth, analyticsController.getEmployeeAnalytics);
router.get('/team', auth, checkPermission(['manager']), analyticsController.getTeamAnalytics);

module.exports = router;
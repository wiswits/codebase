const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const DashboardController = require('../controllers/dashboard.controller');

router.use(authenticate);

router.get('/stats', DashboardController.getStats.bind(DashboardController));
router.get('/activities', DashboardController.getRecentActivities.bind(DashboardController));
router.get('/chart-data', DashboardController.getChartData.bind(DashboardController));
router.get('/distribution', DashboardController.getDistributionData.bind(DashboardController));

module.exports = router;
const express = require('express');
const router = express.Router();
const { dashboardStats, funnel, sourceRoi, setSourceCost } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { ROLES } = require('../config/constants');

// Reports & Analytics is staff-facing (leadership/admin primarily, but readable by all staff roles)
router.use(protect);

router.get('/dashboard', dashboardStats);
router.get('/funnel', funnel); // FR31, FR33
router.get('/source-roi', sourceRoi); // FR32
router.post('/source-cost', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), setSourceCost); // FR32

module.exports = router;

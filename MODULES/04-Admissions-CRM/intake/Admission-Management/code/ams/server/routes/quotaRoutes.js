const express = require('express');
const router = express.Router();
const { listQuotas, upsertQuota, dashboard } = require('../controllers/quotaController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { ROLES } = require('../config/constants');

router.use(protect);

// FR28: real-time seat-fill dashboard vs statutory requirement - any staff role can view
router.get('/dashboard', dashboard);
router.get('/', listQuotas);

// FR25: only admin/admission officer can configure seat pools & statutory percentages
router.post('/', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), upsertQuota);

module.exports = router;

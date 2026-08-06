const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const ctrl = require('./branding.controller');

router.get('/public', ctrl.getPublicBranding);
router.get('/me', authenticate, ctrl.getBranding);

// Added by audit script — root alias
router.get('/', authenticate, ctrl.getBranding);

router.put('/me', authenticate, ctrl.updateBranding);

module.exports = router;

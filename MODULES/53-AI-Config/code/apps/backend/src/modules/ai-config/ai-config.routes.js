'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const ctrl = require('./ai-config.controller');

router.use(authenticate);

router.get('/', ctrl.getConfig);
router.put('/', ctrl.updateConfig);
router.post('/test', ctrl.testConnection);
router.get('/usage', ctrl.getUsage);
router.delete('/', ctrl.resetConfig);

module.exports = router;

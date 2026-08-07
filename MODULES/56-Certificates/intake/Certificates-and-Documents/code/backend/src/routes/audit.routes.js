const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const AuditController = require('../controllers/audit.controller');

router.use(authenticate);

router.get('/', AuditController.getAuditLogs.bind(AuditController));
router.get('/stats', AuditController.getAuditStats.bind(AuditController));

module.exports = router;
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const ApprovalController = require('../controllers/approval.controller');

router.use(authenticate);

router.get('/', ApprovalController.getApprovals.bind(ApprovalController));
router.get('/pending', ApprovalController.getPendingApprovals.bind(ApprovalController));
router.get('/stats', ApprovalController.getApprovalStats.bind(ApprovalController));
router.post('/:approvalId/approve', ApprovalController.approve.bind(ApprovalController));
router.post('/:approvalId/reject', ApprovalController.reject.bind(ApprovalController));

module.exports = router;
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const VerificationController = require('../controllers/verification.controller');

router.post('/verify', VerificationController.verifyDocument.bind(VerificationController));
router.get('/verify/:verificationCode', VerificationController.verifyByCode.bind(VerificationController));
router.get('/document/:documentNumber', VerificationController.getDocumentStatus.bind(VerificationController));
router.get('/qr/:qrCode', VerificationController.verifyQR.bind(VerificationController));

router.use(authenticate);
router.get('/history', VerificationController.getVerificationHistory.bind(VerificationController));
router.get('/stats', VerificationController.getVerificationStats.bind(VerificationController));

module.exports = router;
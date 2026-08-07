const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/logout', auth, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/login-activity', auth, authController.getLoginActivity);
router.get('/validate-token', auth, authController.validateToken);

module.exports = router;
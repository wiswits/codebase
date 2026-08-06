const express = require('express');
const router = express.Router();
const { login, getMe, register, listUsers } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { ROLES } = require('../config/constants');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/register', protect, authorize(ROLES.ADMIN), register);
router.get('/users', protect, listUsers);

module.exports = router;

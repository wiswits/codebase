const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateLeave } = require('../middleware/validation');

router.post('/apply', auth, validateLeave, leaveController.applyLeave);
router.get('/my-leaves', auth, leaveController.getMyLeaves);
router.get('/balance', auth, leaveController.getLeaveBalance);
router.get('/all', auth, checkPermission(['admin', 'hr', 'manager']), leaveController.getAllLeaves);
router.put('/:id/approve', auth, checkPermission(['admin', 'hr', 'manager']), leaveController.approveLeave);

module.exports = router;
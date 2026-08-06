const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateAttendance } = require('../middleware/validation');

router.post('/check-in', auth, validateAttendance, attendanceController.checkIn);
router.post('/check-out', auth, validateAttendance, attendanceController.checkOut);
router.post('/lunch/start', auth, attendanceController.lunchBreakStart);
router.post('/lunch/end', auth, attendanceController.lunchBreakEnd);
router.get('/history', auth, attendanceController.getAttendanceHistory);
router.get('/stats', auth, attendanceController.getAttendanceStats);
router.get('/all', auth, checkPermission(['admin', 'hr', 'manager']), attendanceController.getAllAttendance);
router.put('/:id/correct', auth, checkPermission(['admin', 'hr']), attendanceController.correctAttendance);
router.get('/department/:departmentId', auth, checkPermission(['admin', 'hr', 'manager']), attendanceController.getDepartmentAttendance);

module.exports = router;
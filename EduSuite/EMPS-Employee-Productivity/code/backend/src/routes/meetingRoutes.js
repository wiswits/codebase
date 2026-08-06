const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateMeeting } = require('../middleware/validation');

router.get('/', auth, meetingController.getAllMeetings);
router.get('/my-meetings', auth, meetingController.getMyMeetings);
router.get('/:id', auth, meetingController.getMeetingById);
router.post('/', auth, checkPermission(['admin', 'hr', 'manager']), validateMeeting, meetingController.createMeeting);
router.put('/:id', auth, checkPermission(['admin', 'hr', 'manager']), meetingController.updateMeeting);
router.delete('/:id', auth, checkPermission(['admin', 'hr', 'manager']), meetingController.deleteMeeting);
router.post('/:id/notes', auth, meetingController.addMeetingNotes);

module.exports = router;
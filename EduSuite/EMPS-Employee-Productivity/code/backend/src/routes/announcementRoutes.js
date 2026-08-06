const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateAnnouncement } = require('../middleware/validation');

router.get('/', auth, announcementController.getAllAnnouncements);
router.get('/holidays', auth, announcementController.getHolidayList);
router.get('/:id', auth, announcementController.getAnnouncementById);
router.post('/', auth, checkPermission(['admin', 'hr']), validateAnnouncement, announcementController.createAnnouncement);
router.put('/:id', auth, checkPermission(['admin', 'hr']), announcementController.updateAnnouncement);
router.delete('/:id', auth, checkPermission(['admin', 'hr']), announcementController.deleteAnnouncement);
router.post('/:id/comments', auth, announcementController.addComment);

module.exports = router;
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { auth } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validation');

router.get('/', auth, profileController.getProfile);
router.put('/', auth, validateProfileUpdate, profileController.updateProfile);
router.put('/photo', auth, profileController.updateProfilePhoto);
router.put('/change-password', auth, profileController.changePassword);
router.get('/documents', auth, profileController.getEmployeeDocuments);
router.post('/documents', auth, profileController.uploadEmployeeDocument);
router.delete('/documents/:documentId', auth, profileController.deleteEmployeeDocument);

module.exports = router;
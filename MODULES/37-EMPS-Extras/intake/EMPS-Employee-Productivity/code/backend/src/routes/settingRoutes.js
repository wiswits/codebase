const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

// Get all settings
router.get('/', auth, checkPermission(['admin', 'hr']), settingController.getAllSettings);

// Get setting by key
router.get('/:key', auth, settingController.getSettingByKey);

// Update setting
router.put('/', auth, checkPermission(['admin']), settingController.updateSetting);

// Delete setting
router.delete('/:key', auth, checkPermission(['admin']), settingController.deleteSetting);

// Office location specific routes
router.get('/office/location', auth, settingController.getOfficeLocation);
router.put('/office/location', auth, checkPermission(['admin']), settingController.updateOfficeLocation);

module.exports = router;
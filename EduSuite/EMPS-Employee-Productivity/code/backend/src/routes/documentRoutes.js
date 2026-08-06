const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateDocument } = require('../middleware/validation');
const { uploadSingle, handleUploadError } = require('../middleware/upload');

router.get('/', auth, documentController.getAllDocuments);
router.get('/policies', auth, documentController.getPolicyDocuments);
router.get('/employee/:employeeId', auth, checkPermission(['admin', 'hr']), documentController.getEmployeeDocuments);
router.get('/:id', auth, documentController.getDocumentById);
router.post('/', auth, checkPermission(['admin', 'hr']), uploadSingle('file'), handleUploadError, validateDocument, documentController.uploadDocument);
router.put('/:id', auth, checkPermission(['admin', 'hr']), uploadSingle('file'), handleUploadError, documentController.updateDocument);
router.delete('/:id', auth, checkPermission(['admin', 'hr']), documentController.deleteDocument);

module.exports = router;
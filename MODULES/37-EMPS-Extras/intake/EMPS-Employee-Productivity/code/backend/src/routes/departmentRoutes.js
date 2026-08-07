const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

router.get('/', auth, checkPermission(['admin', 'hr', 'manager']), departmentController.getAllDepartments);
router.get('/:id', auth, checkPermission(['admin', 'hr', 'manager']), departmentController.getDepartmentById);
router.get('/:id/employees', auth, checkPermission(['admin', 'hr', 'manager']), departmentController.getDepartmentEmployees);
router.post('/', auth, checkPermission(['admin']), departmentController.createDepartment);
router.put('/:id', auth, checkPermission(['admin']), departmentController.updateDepartment);
router.delete('/:id', auth, checkPermission(['admin']), departmentController.deleteDepartment);

module.exports = router;
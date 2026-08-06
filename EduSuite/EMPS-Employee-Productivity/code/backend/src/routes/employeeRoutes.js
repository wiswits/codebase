const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateEmployee } = require('../middleware/validation');

router.get('/', auth, checkPermission(['admin', 'hr']), employeeController.getAllEmployees);
router.get('/:id', auth, checkPermission(['admin', 'hr', 'manager']), employeeController.getEmployeeById);
router.post('/', auth, checkPermission(['admin', 'hr']), validateEmployee, employeeController.createEmployee);
router.put('/:id', auth, checkPermission(['admin', 'hr']), employeeController.updateEmployee);
router.delete('/:id', auth, checkPermission(['admin']), employeeController.deleteEmployee);
router.put('/:id/suspend', auth, checkPermission(['admin', 'hr']), employeeController.suspendEmployee);
router.put('/:id/reset-password', auth, checkPermission(['admin', 'hr']), employeeController.resetEmployeePassword);
router.put('/:id/assign-role', auth, checkPermission(['admin']), employeeController.assignRole);

module.exports = router;
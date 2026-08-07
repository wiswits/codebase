import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import { validateRequest } from '../utils/validate-request.middleware';
import {
  createEmployeeValidator,
  deleteEmployeeValidator,
  getEmployeeValidator,
  listEmployeesValidator,
  updateEmployeeValidator,
} from '../validators/employee.validator';
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from '../controllers/employee.controller';

const router = Router();

router.get(
  '/',
  authenticate(),
  requirePermission('employee:view'),
  listEmployeesValidator,
  validateRequest,
  listEmployees,
);

router.get(
  '/:id',
  authenticate(),
  requirePermission('employee:view'),
  getEmployeeValidator,
  validateRequest,
  getEmployee,
);

router.post(
  '/',
  authenticate(),
  requirePermission('employee:create'),
  createEmployeeValidator,
  validateRequest,
  createEmployee,
);

router.patch(
  '/:id',
  authenticate(),
  requirePermission('employee:update'),
  updateEmployeeValidator,
  validateRequest,
  updateEmployee,
);

router.delete(
  '/:id',
  authenticate(),
  requirePermission('employee:delete'),
  deleteEmployeeValidator,
  validateRequest,
  deleteEmployee,
);

export default router;

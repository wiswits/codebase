import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import { validateRequest } from '../utils/validate-request.middleware';
import {
  createUtilizationValidator,
  deleteUtilizationValidator,
  getUtilizationValidator,
  listUtilizationValidator,
  updateUtilizationValidator,
} from '../validators/utilization.validator';
import {
  createUtilization,
  deleteUtilization,
  getUtilization,
  listUtilization,
  updateUtilization,
} from '../controllers/utilization.controller';

const router = Router();

router.get(
  '/',
  authenticate(),
  requirePermission('utilization:view'),
  listUtilizationValidator,
  validateRequest,
  listUtilization,
);

router.get(
  '/:id',
  authenticate(),
  requirePermission('utilization:view'),
  getUtilizationValidator,
  validateRequest,
  getUtilization,
);

router.post(
  '/',
  authenticate(),
  requirePermission('utilization:create'),
  createUtilizationValidator,
  validateRequest,
  createUtilization,
);

router.patch(
  '/:id',
  authenticate(),
  requirePermission('utilization:update'),
  updateUtilizationValidator,
  validateRequest,
  updateUtilization,
);

router.delete(
  '/:id',
  authenticate(),
  requirePermission('utilization:delete'),
  deleteUtilizationValidator,
  validateRequest,
  deleteUtilization,
);

export default router;

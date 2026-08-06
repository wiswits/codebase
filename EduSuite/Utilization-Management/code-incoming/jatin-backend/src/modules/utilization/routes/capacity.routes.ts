import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import { validateRequest } from '../utils/validate-request.middleware';
import {
  createCapacityValidator,
  deleteCapacityValidator,
  getCapacityValidator,
  listCapacityValidator,
  updateCapacityValidator,
} from '../validators/capacity.validator';
import {
  createCapacity,
  deleteCapacity,
  getCapacity,
  listCapacity,
  updateCapacity,
} from '../controllers/capacity.controller';

const router = Router();

router.get(
  '/',
  authenticate(),
  requirePermission('capacity:view'),
  listCapacityValidator,
  validateRequest,
  listCapacity,
);

router.get(
  '/:id',
  authenticate(),
  requirePermission('capacity:view'),
  getCapacityValidator,
  validateRequest,
  getCapacity,
);

router.post(
  '/',
  authenticate(),
  requirePermission('capacity:create'),
  createCapacityValidator,
  validateRequest,
  createCapacity,
);

router.patch(
  '/:id',
  authenticate(),
  requirePermission('capacity:update'),
  updateCapacityValidator,
  validateRequest,
  updateCapacity,
);

router.delete(
  '/:id',
  authenticate(),
  requirePermission('capacity:delete'),
  deleteCapacityValidator,
  validateRequest,
  deleteCapacity,
);

export default router;

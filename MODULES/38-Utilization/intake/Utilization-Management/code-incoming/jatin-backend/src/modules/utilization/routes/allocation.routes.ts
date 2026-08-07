import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import { validateRequest } from '../utils/validate-request.middleware';
import {
  createAllocationValidator,
  deleteAllocationValidator,
  getAllocationValidator,
  listAllocationsValidator,
  updateAllocationValidator,
} from '../validators/allocation.validator';
import {
  createAllocation,
  deleteAllocation,
  getAllocation,
  listAllocations,
  updateAllocation,
} from '../controllers/allocation.controller';

const router = Router();

router.get(
  '/',
  authenticate(),
  requirePermission('allocation:view'),
  listAllocationsValidator,
  validateRequest,
  listAllocations,
);

router.get(
  '/:id',
  authenticate(),
  requirePermission('allocation:view'),
  getAllocationValidator,
  validateRequest,
  getAllocation,
);

router.post(
  '/',
  authenticate(),
  requirePermission('allocation:create'),
  createAllocationValidator,
  validateRequest,
  createAllocation,
);

router.patch(
  '/:id',
  authenticate(),
  requirePermission('allocation:update'),
  updateAllocationValidator,
  validateRequest,
  updateAllocation,
);

router.delete(
  '/:id',
  authenticate(),
  requirePermission('allocation:delete'),
  deleteAllocationValidator,
  validateRequest,
  deleteAllocation,
);

export default router;

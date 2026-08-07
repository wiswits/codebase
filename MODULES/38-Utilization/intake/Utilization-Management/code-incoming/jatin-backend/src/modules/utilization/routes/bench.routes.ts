import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import { validateRequest } from '../utils/validate-request.middleware';
import {
  assignBenchValidator,
  getBenchValidator,
  listBenchValidator,
  unassignBenchValidator,
} from '../validators/bench.validator';
import {
  assignBench,
  getBench,
  listBench,
  unassignBench,
} from '../controllers/bench.controller';

const router = Router();

router.get(
  '/',
  authenticate(),
  requirePermission('utilization:view'),
  listBenchValidator,
  validateRequest,
  listBench,
);

router.get(
  '/:id',
  authenticate(),
  requirePermission('utilization:view'),
  getBenchValidator,
  validateRequest,
  getBench,
);

router.post(
  '/assign',
  authenticate(),
  requirePermission('utilization:assign'),
  assignBenchValidator,
  validateRequest,
  assignBench,
);

router.post(
  '/:id/unassign',
  authenticate(),
  requirePermission('utilization:unassign'),
  unassignBenchValidator,
  validateRequest,
  unassignBench,
);

export default router;

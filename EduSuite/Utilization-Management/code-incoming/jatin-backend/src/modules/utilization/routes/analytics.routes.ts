import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import { validateRequest } from '../utils/validate-request.middleware';
import {
  allocationDistributionValidator,
  benchTrendValidator,
  capacityForecastValidator,
  utilizationTrendValidator,
} from '../validators/analytics.validator';
import {
  getAllocationDistribution,
  getBenchTrend,
  getCapacityForecast,
  getUtilizationTrend,
} from '../controllers/analytics.controller';

const router = Router();

router.get(
  '/utilization-trend',
  authenticate(),
  requirePermission('analytics:view'),
  utilizationTrendValidator,
  validateRequest,
  getUtilizationTrend,
);

router.get(
  '/bench-trend',
  authenticate(),
  requirePermission('analytics:view'),
  benchTrendValidator,
  validateRequest,
  getBenchTrend,
);

router.get(
  '/allocation-distribution',
  authenticate(),
  requirePermission('analytics:view'),
  allocationDistributionValidator,
  validateRequest,
  getAllocationDistribution,
);

router.get(
  '/capacity-forecast',
  authenticate(),
  requirePermission('analytics:view'),
  capacityForecastValidator,
  validateRequest,
  getCapacityForecast,
);

export default router;

import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import { validateRequest } from '../utils/validate-request.middleware';
import { getDashboardSummaryValidator } from '../validators/dashboard.validator';
import { getDashboardSummary } from '../controllers/dashboard.controller';

const router = Router();

router.get(
  '/summary',
  authenticate(),
  requirePermission('dashboard:view'),
  getDashboardSummaryValidator,
  validateRequest,
  getDashboardSummary,
);

export default router;

import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import { validateRequest } from '../utils/validate-request.middleware';
import {
  deleteReportValidator,
  downloadReportValidator,
  generateReportValidator,
  getReportValidator,
  listReportsValidator,
} from '../validators/report.validator';
import {
  deleteReport,
  downloadReport,
  generateReport,
  getReport,
  listReports,
} from '../controllers/report.controller';

const router = Router();

router.get(
  '/',
  authenticate(),
  requirePermission('report:view'),
  listReportsValidator,
  validateRequest,
  listReports,
);

router.get(
  '/:id',
  authenticate(),
  requirePermission('report:view'),
  getReportValidator,
  validateRequest,
  getReport,
);

router.post(
  '/',
  authenticate(),
  requirePermission('report:create'),
  generateReportValidator,
  validateRequest,
  generateReport,
);

router.get(
  '/:id/download',
  authenticate(),
  requirePermission('report:view'),
  downloadReportValidator,
  validateRequest,
  downloadReport,
);

router.delete(
  '/:id',
  authenticate(),
  requirePermission('report:delete'),
  deleteReportValidator,
  validateRequest,
  deleteReport,
);

export default router;

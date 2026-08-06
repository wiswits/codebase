import { Router } from 'express';

import dashboardRoutes from './dashboard.routes';
import employeeRoutes from './employee.routes';
import allocationRoutes from './allocation.routes';
import capacityRoutes from './capacity.routes';
import utilizationRoutes from './utilization.routes';
import benchRoutes from './bench.routes';
import analyticsRoutes from './analytics.routes';
import reportRoutes from './report.routes';
import settingsRoutes from './settings.routes';

/**
 * Composition root for the Utilization Management module.
 * Mount in the main Express app as:
 *   app.use('/api/v1/utilization', utilizationModuleRouter);
 */
const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/employees', employeeRoutes);
router.use('/allocations', allocationRoutes);
router.use('/capacity', capacityRoutes);
router.use('/records', utilizationRoutes);
router.use('/bench', benchRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);

export default router;

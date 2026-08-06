import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import { validateRequest } from '../utils/validate-request.middleware';
import { updateSettingsValidator } from '../validators/settings.validator';
import { getSettings, updateSettings } from '../controllers/settings.controller';

const router = Router();

router.get(
  '/',
  authenticate(),
  requirePermission('settings:view'),
  getSettings,
);

router.patch(
  '/',
  authenticate(),
  requirePermission('settings:update'),
  updateSettingsValidator,
  validateRequest,
  updateSettings,
);

export default router;

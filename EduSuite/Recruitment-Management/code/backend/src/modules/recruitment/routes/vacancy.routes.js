import express from 'express';
import vacancyController from '../controllers/vacancy.controller.js';
import { authenticate, requirePermission } from '../../../middleware/auth.mock.js';  // ✅ CORRECTED
import { PERMISSIONS } from '../../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.VIEW), vacancyController.findAll);
router.get('/recent', requirePermission(PERMISSIONS.VIEW), vacancyController.getRecent);
router.get('/validate-code', requirePermission(PERMISSIONS.CREATE), vacancyController.validateCode);
router.post('/', requirePermission(PERMISSIONS.CREATE), vacancyController.create);
router.get('/:id', requirePermission(PERMISSIONS.VIEW), vacancyController.findById);
router.put('/:id', requirePermission(PERMISSIONS.UPDATE), vacancyController.update);
router.delete('/:id', requirePermission(PERMISSIONS.DELETE), vacancyController.delete);
router.patch('/:id/status', requirePermission(PERMISSIONS.UPDATE), vacancyController.changeStatus);

export default router;
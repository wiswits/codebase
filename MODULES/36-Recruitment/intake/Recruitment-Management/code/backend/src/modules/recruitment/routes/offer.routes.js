import express from 'express';
import offerController from '../controllers/offer.controller.js';
import { authenticate, requirePermission } from '../../../middleware/auth.mock.js';  // ✅ CORRECTED
import { PERMISSIONS } from '../../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.VIEW), offerController.findAll);
router.get('/stats', requirePermission(PERMISSIONS.VIEW), offerController.getStats);
router.get('/applicant/:applicantId', requirePermission(PERMISSIONS.VIEW), offerController.findByApplicant);
router.get('/by-status/:status', requirePermission(PERMISSIONS.VIEW), offerController.findByStatus);
router.post('/', requirePermission(PERMISSIONS.OFFER), offerController.create);
router.get('/:id', requirePermission(PERMISSIONS.VIEW), offerController.findById);
router.put('/:id', requirePermission(PERMISSIONS.OFFER), offerController.update);
router.delete('/:id', requirePermission(PERMISSIONS.DELETE), offerController.delete);
router.patch('/:id/status', requirePermission(PERMISSIONS.OFFER), offerController.updateStatus);

export default router;
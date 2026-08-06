import express from 'express';
import interviewController from '../controllers/interview.controller.js';
import { authenticate, requirePermission } from '../../../middleware/auth.mock.js';  // ✅ CORRECTED
import { PERMISSIONS } from '../../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.VIEW), interviewController.findAll);
router.get('/upcoming', requirePermission(PERMISSIONS.VIEW), interviewController.getUpcoming);
router.get('/stats', requirePermission(PERMISSIONS.VIEW), interviewController.getStats);
router.get('/applicant/:applicantId', requirePermission(PERMISSIONS.VIEW), interviewController.findByApplicant);
router.post('/', requirePermission(PERMISSIONS.INTERVIEW), interviewController.create);
router.get('/:id', requirePermission(PERMISSIONS.VIEW), interviewController.findById);
router.put('/:id', requirePermission(PERMISSIONS.INTERVIEW), interviewController.update);
router.delete('/:id', requirePermission(PERMISSIONS.DELETE), interviewController.delete);
router.patch('/:id/status', requirePermission(PERMISSIONS.INTERVIEW), interviewController.updateStatus);

export default router;
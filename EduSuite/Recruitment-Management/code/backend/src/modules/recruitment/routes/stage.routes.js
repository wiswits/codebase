import express from 'express';
import stageController from '../controllers/stage.controller.js';
import { authenticate, requirePermission } from '../../../middleware/auth.mock.js';  // ✅ CORRECTED
import { PERMISSIONS } from '../../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', requirePermission(PERMISSIONS.VIEW), stageController.getStageStats);
router.get('/average-duration', requirePermission(PERMISSIONS.VIEW), stageController.getAverageDuration);
router.get('/transition-flow', requirePermission(PERMISSIONS.VIEW), stageController.getTransitionFlow);
router.get('/transitions', requirePermission(PERMISSIONS.VIEW), stageController.getTransitions);
router.get('/applicant/:applicantId', requirePermission(PERMISSIONS.VIEW), stageController.findByApplicant);
router.get('/applicant/:applicantId/history', requirePermission(PERMISSIONS.VIEW), stageController.getApplicantHistory);
router.get('/vacancy/:vacancyId', requirePermission(PERMISSIONS.VIEW), stageController.findByVacancy);
router.post('/', requirePermission(PERMISSIONS.UPDATE), stageController.create);

export default router;
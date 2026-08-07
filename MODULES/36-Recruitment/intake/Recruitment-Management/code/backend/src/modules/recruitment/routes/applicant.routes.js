import express from 'express';
import applicantController from '../controllers/applicant.controller.js';
import { authenticate, requirePermission } from '../../../middleware/auth.mock.js';  // ✅ CORRECTED
import { PERMISSIONS } from '../../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.VIEW), applicantController.findAll);
router.get('/recent', requirePermission(PERMISSIONS.VIEW), applicantController.getRecent);
router.get('/pipeline/stats', requirePermission(PERMISSIONS.VIEW), applicantController.getPipelineStats);
router.get('/filter-options', requirePermission(PERMISSIONS.VIEW), applicantController.getFilterOptions);
router.get('/validate-email', requirePermission(PERMISSIONS.CREATE), applicantController.validateEmail);
router.get('/by-vacancy/:vacancyId', requirePermission(PERMISSIONS.VIEW), applicantController.findByVacancy);
router.get('/by-stage/:stage', requirePermission(PERMISSIONS.VIEW), applicantController.findByStage);
router.post('/', requirePermission(PERMISSIONS.CREATE), applicantController.create);
router.post('/bulk-import', requirePermission(PERMISSIONS.CREATE), applicantController.bulkImport);
router.get('/:id', requirePermission(PERMISSIONS.VIEW), applicantController.findById);
router.put('/:id', requirePermission(PERMISSIONS.UPDATE), applicantController.update);
router.delete('/:id', requirePermission(PERMISSIONS.DELETE), applicantController.delete);
router.patch('/:id/stage', requirePermission(PERMISSIONS.UPDATE), applicantController.changeStage);

export default router;
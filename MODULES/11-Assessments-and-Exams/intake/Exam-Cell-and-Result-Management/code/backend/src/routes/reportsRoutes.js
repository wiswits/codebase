import express from 'express';
import { getPassFailTrend, getSubjectPerformance, getExaminationReport } from '../controllers/reportsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/pass-fail-trend', getPassFailTrend);
router.get('/subject-performance', getSubjectPerformance);
router.get('/examination', getExaminationReport);

export default router;

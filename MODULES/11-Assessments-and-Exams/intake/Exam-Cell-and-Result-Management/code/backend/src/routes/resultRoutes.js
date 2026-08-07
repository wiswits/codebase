import express from 'express';
import {
  processResults,
  getResultsByExam,
  getResultSummary,
  updateResultStatus,
  getExamsWithResults,
  getMyResults,
  downloadMarksheetPdf,
} from '../controllers/resultController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/my', authorize('student'), getMyResults);
router.get('/exams-with-results', getExamsWithResults);
router.post('/process/:examId', authorize('admin', 'exam_controller'), processResults);
router.get('/exam/:examId', getResultsByExam);
router.get('/summary/:examId', getResultSummary);
router.put('/status/:examId', authorize('admin', 'exam_controller', 'principal'), updateResultStatus);
router.get('/:id/pdf', downloadMarksheetPdf);

export default router;

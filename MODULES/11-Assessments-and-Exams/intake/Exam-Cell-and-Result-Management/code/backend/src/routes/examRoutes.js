import express from 'express';
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamCalendar,
} from '../controllers/examController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/calendar', getExamCalendar);

router
  .route('/')
  .get(getExams)
  .post(authorize('admin', 'exam_controller'), createExam);

router
  .route('/:id')
  .get(getExamById)
  .put(authorize('admin', 'exam_controller'), updateExam)
  .delete(authorize('admin', 'exam_controller'), deleteExam);

export default router;

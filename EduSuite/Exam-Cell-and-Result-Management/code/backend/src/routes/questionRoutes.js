import express from 'express';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  bulkCreateQuestions,
  updateQuestion,
  deleteQuestion,
  getChaptersForSubject,
} from '../controllers/questionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/chapters/:subjectId', getChaptersForSubject);
router.post('/bulk', authorize('admin', 'teacher', 'exam_controller'), bulkCreateQuestions);

router
  .route('/')
  .get(getQuestions)
  .post(authorize('admin', 'teacher', 'exam_controller'), createQuestion);

router
  .route('/:id')
  .get(getQuestionById)
  .put(authorize('admin', 'teacher', 'exam_controller'), updateQuestion)
  .delete(authorize('admin', 'teacher', 'exam_controller'), deleteQuestion);

export default router;

import express from 'express';
import {
  getMarksSheet,
  bulkSaveMarks,
  getModerationQueue,
  moderateMark,
} from '../controllers/markController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/sheet/:examId', authorize('admin', 'teacher', 'exam_controller'), getMarksSheet);
router.post('/bulk', authorize('admin', 'teacher', 'exam_controller'), bulkSaveMarks);
router.get('/moderation/:examId', authorize('admin', 'exam_controller', 'principal'), getModerationQueue);
router.put('/:id/moderate', authorize('admin', 'exam_controller', 'principal'), moderateMark);

export default router;

import express from 'express';
import { generatePaper, getPapers, getPaperById, deletePaper, downloadPaperPdf } from '../controllers/paperController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', authorize('admin', 'exam_controller', 'teacher'), generatePaper);

router.route('/').get(getPapers);

router.get('/:id/pdf', downloadPaperPdf);

router
  .route('/:id')
  .get(getPaperById)
  .delete(authorize('admin', 'exam_controller'), deletePaper);

export default router;

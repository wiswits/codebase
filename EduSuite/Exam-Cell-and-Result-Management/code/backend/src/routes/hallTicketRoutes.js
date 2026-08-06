import express from 'express';
import {
  generateHallTickets,
  getHallTickets,
  getHallTicketById,
  downloadHallTicketPdf,
} from '../controllers/hallTicketController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', authorize('admin', 'exam_controller'), generateHallTickets);
router.get('/', getHallTickets);
router.get('/:id', getHallTicketById);
router.get('/:id/pdf', downloadHallTicketPdf);

export default router;

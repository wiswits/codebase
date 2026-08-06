import express from 'express';
import {
  generateSeatingPlan,
  getSeatingPlans,
  updateSeatingPlan,
  deleteSeatingPlan,
} from '../controllers/seatingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', authorize('admin', 'exam_controller', 'invigilator'), generateSeatingPlan);

router.route('/').get(getSeatingPlans);

router
  .route('/:id')
  .put(authorize('admin', 'exam_controller', 'invigilator'), updateSeatingPlan)
  .delete(authorize('admin', 'exam_controller'), deleteSeatingPlan);

export default router;

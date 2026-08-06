import express from 'express';
import {
  getInvigilations,
  autoAssignInvigilators,
  createInvigilation,
  updateInvigilation,
  deleteInvigilation,
} from '../controllers/invigilationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/auto-assign', authorize('admin', 'exam_controller'), autoAssignInvigilators);

router
  .route('/')
  .get(getInvigilations)
  .post(authorize('admin', 'exam_controller'), createInvigilation);

router
  .route('/:id')
  .put(authorize('admin', 'exam_controller', 'invigilator'), updateInvigilation)
  .delete(authorize('admin', 'exam_controller'), deleteInvigilation);

export default router;

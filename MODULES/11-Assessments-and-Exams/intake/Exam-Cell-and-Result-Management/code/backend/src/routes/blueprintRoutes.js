import express from 'express';
import { getBlueprints, createBlueprint, updateBlueprint, deleteBlueprint } from '../controllers/blueprintController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getBlueprints)
  .post(authorize('admin', 'exam_controller', 'teacher'), createBlueprint);

router
  .route('/:id')
  .put(authorize('admin', 'exam_controller', 'teacher'), updateBlueprint)
  .delete(authorize('admin', 'exam_controller'), deleteBlueprint);

export default router;

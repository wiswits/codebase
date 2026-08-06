import express from 'express';
import { uploadOMRSheet, getOMRSheets, evaluateOMRSheet, deleteOMRSheet } from '../controllers/omrController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadOMR } from '../config/multer.js';

const router = express.Router();

router.use(protect);

router.post('/upload', authorize('admin', 'teacher', 'invigilator'), uploadOMR.array('sheets', 20), uploadOMRSheet);
router.get('/', getOMRSheets);
router.post('/:id/evaluate', authorize('admin', 'teacher'), evaluateOMRSheet);
router.delete('/:id', authorize('admin', 'teacher'), deleteOMRSheet);

export default router;

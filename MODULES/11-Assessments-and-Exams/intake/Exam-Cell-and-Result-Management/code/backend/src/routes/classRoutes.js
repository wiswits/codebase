import express from 'express';
import { getClasses, getSubjects, getStudentsByClass } from '../controllers/classController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getClasses);
router.get('/subjects', getSubjects);
router.get('/:id/students', getStudentsByClass);

export default router;

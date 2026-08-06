const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateTask } = require('../middleware/validation');

router.get('/', auth, checkPermission(['admin', 'hr', 'manager']), taskController.getAllTasks);
router.get('/my-tasks', auth, taskController.getMyTasks);
router.get('/:id', auth, taskController.getTaskById);
router.post('/', auth, checkPermission(['admin', 'hr', 'manager']), validateTask, taskController.createTask);
router.put('/:id', auth, checkPermission(['admin', 'hr', 'manager']), taskController.updateTask);
router.delete('/:id', auth, checkPermission(['admin']), taskController.deleteTask);
router.post('/:id/comments', auth, taskController.addComment);
router.post('/:id/upload-work', auth, taskController.uploadWork);

module.exports = router;
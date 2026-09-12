const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  completeTask,
  deleteTask
} = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');
const { checkListAccess, checkTaskAccess } = require('../middleware/listAccessMiddleware');

router.use(authenticate);

router.route('/')
  .get(getTasks)
  .post(checkListAccess('editor'), createTask);

router.route('/:id')
  .get(checkTaskAccess('viewer'), getTaskById)
  .put(checkTaskAccess('editor'), updateTask)
  .delete(checkTaskAccess('editor'), deleteTask);

router.patch('/:id/complete', checkTaskAccess('editor'), completeTask);

module.exports = router;

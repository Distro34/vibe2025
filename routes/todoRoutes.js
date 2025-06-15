const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.verifyToken);

router.route('/')
  .get(todoController.getAllTasks)
  .post(todoController.createTask);

router.route('/:id')
  .put(todoController.updateTask)
  .delete(todoController.deleteTask);

module.exports = router;
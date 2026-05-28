import express from 'express';
import { createTodo, getUserTodos, completeTodo } from '../controllers/Todo.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.post('/', createTodo);
router.get('/', getUserTodos); // Removed :user_id from the URL
router.put('/:todo_id/complete', completeTodo);

export { router as todoRouter };
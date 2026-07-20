import express from 'express';
import { createTodo, getUserAllTodos, completeTodo, deleteTodo } from '../controllers/Todo.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.post('/', createTodo);
router.get('/', getUserAllTodos); // Removed :user_id from the URL
router.put('/:todo_id/complete', completeTodo);
router.delete('/:todo_id', deleteTodo);

export { router as todoRouter };
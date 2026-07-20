
import { insertTodo, getTodosByUserId, updateTodo, getUserTodosByDate, deleteTodo as deleteTodoModel } from '../models/todo.js';
import { updateUserStreak } from '../models/user.js';

export const createTodo = async (req, res) => {
  try {
    const { 
      task, 
      status = false, 
      notification_enabled = false, 
      date,              // Expected format: 'YYYY-MM-DD'
    } = req.body;

    const user_id = req.user.id;

    // Basic validation
    if (!task || !user_id) {
      return res.status(400).json({ error: 'Task and user_id are required.' });
    }

    // Call the model function with the new date parameter
    const newTodo = await insertTodo(task, status, notification_enabled, date, user_id);

    res.status(201).json({
      message: 'Todo created successfully',
      todo: newTodo
    });

  } catch (error) {
    if (error.code === '23503') {
      return res.status(404).json({ error: 'The provided user_id does not exist.' });
    }
    
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// (getUserAllTodos remains exactly the same)
export const getUserAllTodos = async (req, res) => {
  try {
    const user_id = req.user.id;
    const todos = await getTodosByUserId(user_id);
    res.status(200).json({ todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// // (getUserTodosByDate remains exactly the same)
// export const getUserTodosByDate = async (req, res) => {
//   try {
//     const user_id = req.user.id;
//     const { date } = req.body; // Expected format: 'YYYY-MM-DD'

//     if (!date) {
//       return res.status(400).json({ error: 'Date is required.' });
//     }

//     const todos = await getUserTodosByDate(user_id, date);
//     res.status(200).json({ todos });
//   } catch (error) {
//     console.error('Error fetching todos:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

export const completeTodo = async (req, res) => {
  try {
    const { todo_id } = req.params;
    const updated = await updateTodo(todo_id, {
      status: true,
      completed_at: new Date(),
    });
    if (!updated) return res.status(404).json({ error: 'Todo not found.' });

    await updateUserStreak(req.user.id);
    
    res.status(200).json({ todo: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const { todo_id } = req.params;
    const user_id = req.user.id;
    const deleted = await deleteTodoModel(todo_id, user_id);
    if (!deleted) return res.status(404).json({ error: 'Todo not found.' });
    res.status(200).json({ message: 'Todo deleted successfully', todo: deleted });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
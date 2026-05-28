
import { insertTodo, getTodosByUserId } from '../models/Todo.js';

export const createTodo = async (req, res) => {
  try {
    const { 
      task, 
      status = false, 
      notification_enabled = false, 
      date,              // Expected format: 'YYYY-MM-DD'
      user_id 
    } = req.body;

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

// (getUserTodos remains exactly the same)
export const getUserTodos = async (req, res) => {
  try {
    const { user_id } = req.params; 
    const todos = await getTodosByUserId(user_id);
    res.status(200).json({ todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
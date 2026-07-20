// models/Todo.js
import { query } from '../config/db.js';

// 1. Function to create the table
export const createTodoTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS todos (
      todo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task TEXT NOT NULL,
      status BOOLEAN DEFAULT FALSE,
      notification_enabled BOOLEAN DEFAULT FALSE,
      todo_date DATE DEFAULT CURRENT_DATE,      -- NEW: Stores the date for the task
      user_id UUID NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP DEFAULT NULL,
      
      CONSTRAINT fk_user_todo
        FOREIGN KEY(user_id) 
        REFERENCES users(user_id)
        ON DELETE CASCADE
    );
  `;
  await query(sql);
  console.log('Todos table ready.');
};

// 2. Add a new todo (Updated with todoDate)
export const insertTodo = async (task, status = false, notificationEnabled = false, todoDate, userId) => {
  const sql = `
    INSERT INTO todos (
      task, 
      status, 
      notification_enabled, 
      todo_date, 
      user_id
    ) 
    VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5) 
    RETURNING *;
  `;
  
  // Pass null if todoDate is undefined so COALESCE kicks in
  const { rows } = await query(sql, [
    task, 
    status, 
    notificationEnabled, 
    todoDate || null, 
    userId
  ]);
  
  return rows[0];
};

// 3. Get all todos for a specific user (Unchanged)
export const getTodosByUserId = async (userId) => {
  const sql = `
    SELECT * FROM todos 
    WHERE user_id = $1 
    ORDER BY todo_date ASC, created_at DESC; -- Updated to sort by date first
  `;
  const { rows } = await query(sql, [userId]);
  return rows;
};

export const updateTodo = async (todoId, fields) => {
  const { status, completed_at } = fields;
  const sql = `
    UPDATE todos SET status = $1, completed_at = $2
    WHERE todo_id = $3 RETURNING *;
  `;
  const { rows } = await query(sql, [status, completed_at, todoId]);
  // console.log('updateTodo result:', rows); // Debugging line to check the query result
  return rows[0];
};

export const getUserTodosByDate = async (userId, targetDate) => {
  const sql = `
    SELECT * FROM todos 
    WHERE user_id = $1 
      AND todo_date >= $2::DATE - 6
      AND todo_date <= $2::DATE
    ORDER BY todo_date ASC, created_at DESC;
  `;
  
  const { rows } = await query(sql, [userId, targetDate]);
  return rows;
};

// 6. Delete a todo by ID (scoped to user)
export const deleteTodo = async (todoId, userId) => {
  const sql = `
    DELETE FROM todos
    WHERE todo_id = $1 AND user_id = $2
    RETURNING *;
  `;
  const { rows } = await query(sql, [todoId, userId]);
  return rows[0]; // undefined if not found
};
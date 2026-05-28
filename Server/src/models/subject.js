// models/Subject.js
import { query } from '../db.js';

// 1. Function to create the table
export const createSubjectTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS subjects (
      subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject_name VARCHAR(255) NOT NULL,
      user_id UUID NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      -- This defines the foreign key relationship
      CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(user_id)
        ON DELETE CASCADE -- If a user is deleted, their subjects are deleted too
    );
  `;
  await query(sql);
  console.log('Subjects table ready.');
};

// 2. Add a new subject for a user
export const insertSubject = async (subjectName, userId) => {
  const sql = `
    INSERT INTO subjects (subject_name, user_id) 
    VALUES ($1, $2) 
    RETURNING *;
  `;
  const { rows } = await query(sql, [subjectName, userId]);
  return rows[0];
};

// 3. Get all subjects for a specific user
export const getSubjectsByUserId = async (userId) => {
  const sql = `
    SELECT * FROM subjects 
    WHERE user_id = $1 
    ORDER BY created_at DESC;
  `;
  const { rows } = await query(sql, [userId]);
  return rows;
};
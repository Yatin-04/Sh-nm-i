// models/Session.js
import { query } from '../config/db.js';

export const createSessionTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS sessions (
      session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject_id UUID NOT NULL,
      user_id UUID NOT NULL,                           -- NEW: Add user_id
      session_date DATE DEFAULT CURRENT_DATE,          
      planned_duration INTEGER DEFAULT 0,              
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP,
      actual_duration INTEGER DEFAULT 0,
      session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('focus', 'break')),
      is_completed BOOLEAN DEFAULT FALSE,
      
      CONSTRAINT fk_subject_session FOREIGN KEY(subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
      CONSTRAINT fk_user_session FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE -- NEW: Foreign key constraint
    );
  `;
  await query(sql);
  console.log('Sessions table ready.');
};

// Updated: Now accepts sessionDate, plannedDuration, and userId
export const insertSession = async (subjectId, sessionType, sessionDate, plannedDuration, userId) => {
  const sql = `
    INSERT INTO sessions (
      subject_id, 
      session_type, 
      session_date, 
      planned_duration,
      user_id
    ) 
    -- COALESCE handles undefined/null values by falling back to DB defaults
    VALUES ($1, $2, COALESCE($3, CURRENT_DATE), COALESCE($4, 0), $5) 
    RETURNING *;
  `;
  
  // Pass null if the variables are undefined so pg doesn't throw an error
  const { rows } = await query(sql, [
    subjectId, 
    sessionType, 
    sessionDate || null, 
    plannedDuration || 0,
    userId
  ]);
  
  return rows[0];
};

// (completeSession and getSessionsBySubjectId remain exactly the same)
export const completeSession = async (sessionId, durationInSeconds) => {
  const sql = `
    UPDATE sessions 
    SET 
      end_time = CURRENT_TIMESTAMP,
      actual_duration = $1,
      is_completed = TRUE
    WHERE session_id = $2
    RETURNING *;
  `;
  const { rows } = await query(sql, [durationInSeconds, sessionId]);
  return rows[0];
};

export const getSessionsBySubjectId = async (subjectId) => {
  const sql = `
    SELECT * FROM sessions 
    WHERE subject_id = $1 
    ORDER BY start_time DESC;
  `;
  const { rows } = await query(sql, [subjectId]);
  return rows;
};
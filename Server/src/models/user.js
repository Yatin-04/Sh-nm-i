// User.js
import { query } from './db.js';
import bcrypt from 'bcrypt';

// 1. Function to create the table (you can run this once on startup)
export const createUserTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await query(sql);
  console.log('Users table ready.');
};

// 2. Function to register a new user
export const registerUser = async (name, rawPassword) => {
  // Hash the password manually before it goes to the DB
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

  const sql = `
    INSERT INTO users (name, password) 
    VALUES ($1, $2) 
    RETURNING user_id, name;
  `;
  
  // Use parameterized queries to prevent SQL injection
  const { rows } = await query(sql, [name, hashedPassword]);
  return rows[0]; // Returns the newly created user without the password
};

// 3. Function to verify login
export const verifyUser = async (name, rawPassword) => {
  const sql = `SELECT * FROM users WHERE name = $1;`;
  const { rows } = await query(sql, [name]);
  
  if (rows.length === 0) return null; // User not found
  
  const user = rows[0];
  const isValid = await bcrypt.compare(rawPassword, user.password);
  
  return isValid ? user : null;
};

// Function to check if a user exists by email
export const findUserByEmail = async (email) => {
  const sql = `SELECT user_id, email FROM users WHERE email = $1;`;
  const { rows } = await query(sql, [email]);
  
  // Return the user if found, otherwise return null
  return rows.length > 0 ? rows[0] : null; 
};
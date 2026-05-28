import pg from 'pg';
import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();

const { Pool } = pg;

// Validate that required DB environment variables exist
const dbEnvSchema = z.object({
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(0, "Password can be empty or set").optional(), // Sometimes local dev passes empty, but min(1) is safer for prod
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().default(5432),
  DB_NAME: z.string().min(1),
});

const envVars = dbEnvSchema.parse(process.env);

// The Pool manages a dynamic list of client connections to the database.
// This is highly recommended for web apps over using a single Client.
const pool = new Pool({
  user: envVars.DB_USER,
  password: envVars.DB_PASSWORD,
  host: envVars.DB_HOST,
  port: envVars.DB_PORT,
  database: envVars.DB_NAME,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export a query function that allows you to easily execute SQL
export const query = (text, params) => pool.query(text, params);

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    client.release();
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err);
    process.exit(1);
  }
};
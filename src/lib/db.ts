import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use a default local connection string if DATABASE_URL is not set.
// This is useful for local development without needing a .env file.
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

export const pool = new Pool({
  connectionString: connectionString,
});

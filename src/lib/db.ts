import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

let pool: Pool;

// Helper to find the .env file
const findEnvFile = () => {
    const projectRoot = process.cwd();
    // Prioritize .env.local if it exists
    if (fs.existsSync(path.join(projectRoot, '.env.local'))) {
        return path.join(projectRoot, '.env.local');
    }
    if (fs.existsSync(path.join(projectRoot, '.env'))) {
        return path.join(projectRoot, '.env');
    }
    return null;
}

export const getPool = () => {
    if (!pool) {
        const envPath = findEnvFile();
        if (envPath) {
            dotenv.config({ path: envPath });
        } else {
            console.warn("No .env or .env.local file found. The application may not be able to connect to the database if environment variables are not set elsewhere.");
        }

        const { DATABASE_URL } = process.env;

        if (!DATABASE_URL) {
             const errorMessage = `FATAL: Missing DATABASE_URL environment variable. Please set it in your environment file (e.g., .env or .env.local).`;
             console.error("\n\n\x1b[31m" + errorMessage + "\x1b[0m");
             console.error("Example:");
             console.error("\x1b[32mDATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/route\"\x1b[0m");
             console.error("\nAfter creating/updating the file, you may need to restart the development server.\n\n");
             // Throw an error instead of exiting the process to allow for graceful handling by the framework.
             throw new Error(errorMessage);
        }
        
        pool = new Pool({
            connectionString: DATABASE_URL,
        });
    }
    return pool;
};

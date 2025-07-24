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

        const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;

        if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE || !PGPORT) {
             console.error("\n\n\x1b[31mFATAL: Missing one or more required database environment variables.\x1b[0m");
             console.error("Please ensure PGHOST, PGUSER, PGPASSWORD, PGDATABASE, and PGPORT are set in your environment file (e.g., .env or .env.local).");
             console.error("Example:");
             console.error("\x1b[32mPGHOST=localhost\x1b[0m");
             console.error("\x1b[32mPGUSER=postgres\x1b[0m");
             console.error("\x1b[32mPGPASSWORD=postgres\x1b[0m");
             console.error("\x1b[32mPGDATABASE=route\x1b[0m");
             console.error("\x1b[32mPGPORT=5432\x1b[0m");
             console.error("\nAfter creating/updating the file, you may need to restart the development server.\n\n");
             process.exit(1); // Exit the process if the database is not configured.
        }
        
        pool = new Pool({
            host: PGHOST,
            user: PGUSER,
            password: PGPASSWORD,
            database: PGDATABASE,
            port: Number(PGPORT),
        });
    }

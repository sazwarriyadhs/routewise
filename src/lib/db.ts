import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

let pool: Pool;

// Helper to find the .env file
const findEnvFile = () => {
    const projectRoot = process.cwd();
    if (fs.existsSync(path.join(projectRoot, '.env.local'))) {
        return path.join(projectRoot, '.env.local');
    }
    if (fs.existsSync(path.join(projectRoot, '.env'))) {
        return path.join(projectRoot, '.env');
    }
    return null;
}

const getPool = () => {
    if (!pool) {
        const envPath = findEnvFile();
        if (envPath) {
            dotenv.config({ path: envPath });
        } else {
            console.warn("No .env or .env.local file found. The application may not be able to connect to the database.");
        }

        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
             console.error("\n\n\x1b[31mFATAL: DATABASE_URL is not set in your environment.\x1b[0m");
             console.error("Please create a `.env.local` file in the root of your project and add the following line:");
             console.error("\x1b[32mDATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/route\"\x1b[0m");
             console.error("After creating the file, you may need to restart the development server.\n\n");
             process.exit(1);
        }
        
        pool = new Pool({
            connectionString: connectionString,
        });
    }
    return pool;
}

export { getPool as pool };

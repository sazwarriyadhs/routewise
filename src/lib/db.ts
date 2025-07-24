import { Pool } from 'pg';

let pool: Pool;

// Note: We removed the manual dotenv loading. 
// Next.js automatically loads variables from .env.local into process.env.
// This is a cleaner and more standard approach.

export const getPool = () => {
    if (!pool) {
        const { DATABASE_URL } = process.env;

        if (!DATABASE_URL) {
             const errorMessage = `FATAL: Missing DATABASE_URL environment variable. Please ensure it is set in your .env.local file.`;
             console.error("\n\n\x1b[31m" + errorMessage + "\x1b[0m");
             console.error("Example:");
             console.error("\x1b[32mDATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/route\"\x1b[0m");
             console.error("\nAfter creating/updating the file, you must restart the development server.\n\n");
             throw new Error(errorMessage);
        }
        
        pool = new Pool({
            connectionString: DATABASE_URL,
        });
    }
    return pool;
};

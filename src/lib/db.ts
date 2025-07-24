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
             console.error("\x1b[32mDATABASE_URL=\"postgresql://postgres:postgres@127.0.0.1:5432/route\"\x1b[0m");
             console.error("\nAfter creating/updating the file, you must restart the development server.\n\n");
             throw new Error(errorMessage);
        }
        
        pool = new Pool({
            connectionString: DATABASE_URL,
        });

        // Add a one-time connection test with better error logging
        pool.connect((err, client, release) => {
            if (err) {
                let errorMessage = `FATAL: Failed to connect to the database at ${DATABASE_URL}.`;
                if ((err as any).code === 'ECONNREFUSED') {
                    errorMessage += "\n\x1b[31mConnection refused. Is your PostgreSQL server running?\x1b[0m";
                    console.error("\n\n" + errorMessage + "\n\n");
                } else {
                    console.error(errorMessage, err.stack);
                }
                // We don't throw an error here to avoid crashing the server on startup,
                // but subsequent queries will fail. The log is the important part.
            } else {
                console.log("Database connection pool initialized successfully.");
                release();
            }
        });
    }
    return pool;
};

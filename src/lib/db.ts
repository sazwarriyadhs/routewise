import { Pool } from 'pg';
import dotenv from 'dotenv';

let pool: Pool;

const getPool = () => {
    if (!pool) {
        dotenv.config({ path: '.env' });

        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            console.warn("DATABASE_URL not found in .env, using default local connection string. This may not work in production.");
        }
        
        pool = new Pool({
            connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/route',
        });
    }
    return pool;
}

export { getPool as pool };

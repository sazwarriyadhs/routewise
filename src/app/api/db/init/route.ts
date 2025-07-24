import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();
    try {
      // Create the vehicle_locations table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS vehicle_locations (
          vehicle_id VARCHAR(255) PRIMARY KEY,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          speed INTEGER,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Create the gps_logs table for historical data
      await client.query(`
        CREATE TABLE IF NOT EXISTS gps_logs (
          id SERIAL PRIMARY KEY,
          vehicle_id VARCHAR(255) NOT NULL,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          speed INTEGER,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      
      return NextResponse.json({ success: true, message: 'Database schema initialized.' }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

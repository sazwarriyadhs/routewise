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
      
      // Optional: You could also pre-populate with mock data if the table is empty
      // await client.query(`
      //   INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, speed) 
      //   SELECT 'V001', 34.0522, -118.2437, 0 WHERE NOT EXISTS (SELECT 1 FROM vehicle_locations);
      //   -- Add other vehicles
      // `);

      return NextResponse.json({ success: true, message: 'Database schema initialized.' }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

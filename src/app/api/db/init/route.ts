import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create vehicles table for master data
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('Truck', 'Van', 'Car'))
      );
    `);

    // Create vehicle_locations table for live telemetry
    // Added foreign key constraint to the new vehicles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_locations (
        vehicle_id VARCHAR(255) PRIMARY KEY,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        speed INTEGER,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_vehicle
          FOREIGN KEY(vehicle_id) 
	        REFERENCES vehicles(id)
	        ON DELETE CASCADE
      );
    `);

    // Create gps_logs table for historical data
    await client.query(`
      CREATE TABLE IF NOT EXISTS gps_logs (
        id SERIAL PRIMARY KEY,
        vehicle_id VARCHAR(255) NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        speed INTEGER,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_gps_vehicle
          FOREIGN KEY(vehicle_id) 
	        REFERENCES vehicles(id)
	        ON DELETE CASCADE
      );
    `);
    
    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'Database schema initialized successfully.' }, { status: 200 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('DB Init Error:', error.message);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}

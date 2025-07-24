import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { vehicle_id, latitude, longitude, speed } = await request.json();

    if (!vehicle_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields: vehicle_id, latitude, and longitude are required.' },
        { status: 400 }
      );
    }

    // This query will insert a new location or update the existing one for the vehicle_id
    const query = `
      INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, speed, timestamp)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (vehicle_id) 
      DO UPDATE SET 
        latitude = EXCLUDED.latitude, 
        longitude = EXCLUDED.longitude, 
        speed = EXCLUDED.speed,
        timestamp = NOW();
    `;

    await pool.query(query, [vehicle_id, latitude, longitude, speed || 0]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to save location:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT 
        vl.vehicle_id,
        vl.latitude,
        vl.longitude,
        vl.speed,
        vl.timestamp,
        CASE 
          WHEN vl.timestamp > NOW() - INTERVAL '5 minutes' THEN 
            CASE 
              WHEN vl.speed > 2 THEN 'Moving'
              ELSE 'Idle'
            END
          ELSE 'Offline'
        END as status
      FROM vehicle_locations vl;
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

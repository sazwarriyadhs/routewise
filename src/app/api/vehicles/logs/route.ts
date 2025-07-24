import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const vehicleId = req.nextUrl.searchParams.get('vehicle_id');

  if (!vehicleId) {
    return NextResponse.json({ error: 'vehicle_id is required' }, { status: 400 });
  }

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT latitude, longitude, timestamp FROM gps_logs WHERE vehicle_id = $1 ORDER BY timestamp ASC`,
      [vehicleId]
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Vehicle Logs Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { pool as getPool } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  vehicleId: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawStartDate = searchParams.get('startDate');
  const rawEndDate = searchParams.get('endDate');
  const vehicleId = searchParams.get('vehicleId');

  try {
    const { startDate, endDate } = schema.parse({ 
      startDate: rawStartDate, 
      endDate: rawEndDate,
      vehicleId: vehicleId,
    });
    const pool = getPool();
    const client = await pool.connect();
    try {
      let query = `
        SELECT vehicle_id, latitude, longitude, speed, timestamp
        FROM gps_logs
        WHERE timestamp >= $1 AND timestamp < $2
      `;
      const queryParams: (string | Date)[] = [startDate, endDate];

      if (vehicleId) {
        query += ` AND vehicle_id = $3`;
        queryParams.push(vehicleId);
      }

      query += ` ORDER BY vehicle_id, timestamp ASC;`;
      
      const { rows } = await client.query(query, queryParams);

      return NextResponse.json(rows, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid query parameters. startDate, endDate (ISO strings) are required, and vehicleId is optional.' }, { status: 400 });
    }
    console.error('Failed to fetch historical data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

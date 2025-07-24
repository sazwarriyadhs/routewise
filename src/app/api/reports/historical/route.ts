import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawStartDate = searchParams.get('startDate');
  const rawEndDate = searchParams.get('endDate');

  try {
    const { startDate, endDate } = schema.parse({ startDate: rawStartDate, endDate: rawEndDate });

    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT vehicle_id, latitude, longitude, speed, timestamp
         FROM gps_logs
         WHERE timestamp >= $1 AND timestamp < $2
         ORDER BY vehicle_id, timestamp ASC;`,
        [startDate, endDate]
      );
      return NextResponse.json(rows, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid query parameters. startDate and endDate must be valid ISO date strings.' }, { status: 400 });
    }
    console.error('Failed to fetch historical data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

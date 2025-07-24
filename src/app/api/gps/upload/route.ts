
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { z } from 'zod';

const gpsLogSchema = z.object({
  vehicle_id: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number().optional(),
  timestamp: z.string().datetime().optional(),
});

const uploadSchema = z.object({
  logs: z.array(gpsLogSchema),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { logs } = uploadSchema.parse(body);

    if (!logs || logs.length === 0) {
      return NextResponse.json({ message: 'No logs provided.' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO gps_logs (vehicle_id, latitude, longitude, speed, timestamp)
        VALUES ($1, $2, $3, $4, $5);
      `;

      for (const log of logs) {
        await client.query(query, [
          log.vehicle_id,
          log.latitude,
          log.longitude,
          log.speed ?? 0,
          log.timestamp ?? new Date().toISOString(),
        ]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json({ success: true, count: logs.length }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Invalid data format.', errors: error.errors }, { status: 400 });
    }
    console.error('Failed to upload GPS logs:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

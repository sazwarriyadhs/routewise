
import { NextResponse } from 'next/server';
import { pool as getPool } from '@/lib/db';
import { z } from 'zod';

const gpsLogSchema = z.object({
  vehicle_id: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number().optional(),
  timestamp: z.string().datetime().optional(),
});

// Allow either a single log or an array of logs
const uploadSchema = z.object({
  logs: z.array(gpsLogSchema),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if the body is a single log object and wrap it in an array if so
    const logsPayload = Array.isArray(body.logs) ? body.logs : [body];
    const validation = uploadSchema.safeParse({ logs: logsPayload });

    if (!validation.success) {
      // Try parsing as a single object if array fails
      const singleLogValidation = gpsLogSchema.safeParse(body);
      if(singleLogValidation.success) {
        validation.data = { logs: [singleLogValidation.data] };
      } else {
        return NextResponse.json({ message: 'Invalid data format.', errors: validation.error.errors }, { status: 400 });
      }
    }

    const { logs } = validation.data;

    if (!logs || logs.length === 0) {
      return NextResponse.json({ message: 'No logs provided.' }, { status: 400 });
    }

    const pool = getPool();
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

import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { z } from 'zod';

const vehicleSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(['Truck', 'Van', 'Car']),
});

export async function GET() {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT id, name, type FROM vehicles ORDER BY id ASC');
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Vehicles GET Error:', error.message);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = vehicleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid data', errors: validation.error.errors }, { status: 400 });
    }
    
    const { id, name, type } = validation.data;
    const pool = getPool();
    const { rows } = await pool.query(
      'INSERT INTO vehicles (id, name, type) VALUES ($1, $2, $3) RETURNING id, name, type',
      [id, name, type]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
        return NextResponse.json({ message: `A vehicle with ID '${error.constraint.split('_')[1]}' already exists.` }, { status: 409 });
    }
    console.error('Vehicle POST Error:', error.message);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

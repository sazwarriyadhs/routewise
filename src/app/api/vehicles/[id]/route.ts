import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { z } from 'zod';

const vehicleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['Truck', 'Van', 'Car']),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const pool = getPool();
    const { rows } = await pool.query('SELECT id, name, type FROM vehicles WHERE id = $1', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error(`Vehicle GET Error for ID ${params.id}:`, error.message);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const validation = vehicleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid data', errors: validation.error.errors }, { status: 400 });
    }

    const { name, type } = validation.data;
    const pool = getPool();
    const { rows } = await pool.query(
      'UPDATE vehicles SET name = $1, type = $2 WHERE id = $3 RETURNING id, name, type',
      [name, type, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error(`Vehicle PUT Error for ID ${params.id}:`, error.message);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const pool = getPool();
    // The ON DELETE CASCADE constraint will handle related records in other tables
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Vehicle DELETE Error for ID ${params.id}:`, error.message);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

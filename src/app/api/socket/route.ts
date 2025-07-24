import { NextResponse } from 'next/server';

// This route is a dummy to make the Next.js dev server happy.
// The actual socket server is run separately via `npm run dev:socket`.
export async function GET() {
  return NextResponse.json({ message: 'Socket server is running separately.' });
}

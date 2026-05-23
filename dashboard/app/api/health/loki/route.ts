import { NextResponse } from 'next/server';

// Check Loki health via its ready endpoint
export async function GET() {
  try {
    const res = await fetch('http://localhost:3100/ready');
    return res.ok ? NextResponse.json({ status: 'up' }) : NextResponse.json({ status: 'down' }, { status: 503 });
  } catch {
    return NextResponse.json({ status: 'down' }, { status: 503 });
  }
}

import { NextResponse } from 'next/server';

// Check APISIX gateway health via Admin API
export async function GET() {
  try {
    const res = await fetch('http://localhost:9180/apisix/admin/routes', {
      headers: { 'X-API-KEY': process.env.APISIX_ADMIN_KEY || 'apisixforge-admin-key' },
    });
    return res.ok ? NextResponse.json({ status: 'up' }) : NextResponse.json({ status: 'down' }, { status: 503 });
  } catch {
    return NextResponse.json({ status: 'down' }, { status: 503 });
  }
}

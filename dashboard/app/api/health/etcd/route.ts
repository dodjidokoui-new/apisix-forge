import { NextResponse } from 'next/server';

// Check etcd health indirectly — APISIX Admin API only works if etcd is reachable
export async function GET() {
  try {
    const res = await fetch('http://localhost:9180/apisix/admin/routes', {
      headers: { 'X-API-KEY': process.env.APISIX_ADMIN_KEY || 'apisixforge-admin-key' },
    });
    // If APISIX can serve routes from etcd, etcd is reachable
    return res.ok
      ? NextResponse.json({ status: 'up' })
      : NextResponse.json({ status: 'down' }, { status: 503 });
  } catch {
    return NextResponse.json({ status: 'down' }, { status: 503 });
  }
}

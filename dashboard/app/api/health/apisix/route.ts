import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

/** Check APISIX gateway health via the Admin API. */
export async function GET() {
  try {
    const res = await fetch(`${config.apisix.adminUrl}/apisix/admin/routes`, {
      headers: { 'X-API-KEY': config.apisix.adminKey },
    });
    return res.ok
      ? NextResponse.json({ status: 'up' })
      : NextResponse.json({ status: 'down' }, { status: 503 });
  } catch {
    return NextResponse.json({ status: 'down' }, { status: 503 });
  }
}

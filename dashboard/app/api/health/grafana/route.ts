import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

/** Check Grafana health via its built-in health endpoint. */
export async function GET() {
  try {
    const res = await fetch(`${config.grafana.url}/api/health`);
    return res.ok
      ? NextResponse.json({ status: 'up' })
      : NextResponse.json({ status: 'down' }, { status: 503 });
  } catch {
    return NextResponse.json({ status: 'down' }, { status: 503 });
  }
}

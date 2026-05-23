import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

/** Check Prometheus health via its ready endpoint. */
export async function GET() {
  try {
    const res = await fetch(`${config.prometheus.url}/-/ready`);
    return res.ok
      ? NextResponse.json({ status: 'up' })
      : NextResponse.json({ status: 'down' }, { status: 503 });
  } catch {
    return NextResponse.json({ status: 'down' }, { status: 503 });
  }
}

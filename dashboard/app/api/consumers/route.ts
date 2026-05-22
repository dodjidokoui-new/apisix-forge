import { NextResponse } from 'next/server';
import { getConsumers } from '@/lib/apisix';
import { randomBytes } from 'crypto';

const APISIX_ADMIN_URL = process.env.APISIX_ADMIN_URL || 'http://localhost:9180';
const APISIX_ADMIN_KEY = process.env.APISIX_ADMIN_KEY || 'apisixforge-admin-key';

export async function GET() {
  try {
    const data = await getConsumers();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch consumers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { username, authType } = await req.json();

    // APISIX only allows alphanumeric and underscores in consumer usernames
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must only contain letters, numbers and underscores' },
        { status: 400 }
      );
    }

    const plugins: Record<string, unknown> = {};

    if (authType === 'key-auth') {
      // Generate a random API key for the consumer
      const apiKey = randomBytes(24).toString('hex');
      plugins['key-auth'] = { key: apiKey };
    } else if (authType === 'jwt-auth') {
      // Generate a random secret for JWT signing
      const secret = randomBytes(32).toString('hex');
      plugins['jwt-auth'] = { key: username, secret };
    }

    const res = await fetch(`${APISIX_ADMIN_URL}/apisix/admin/consumers`, {
      method: 'PUT',
      headers: {
        'X-API-KEY': APISIX_ADMIN_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, plugins }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to create consumer' }, { status: 500 });
  }
}

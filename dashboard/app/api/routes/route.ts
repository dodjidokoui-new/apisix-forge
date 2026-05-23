import { NextResponse } from 'next/server';
import { getRoutes } from '@/lib/apisix';

const APISIX_ADMIN_URL = process.env.APISIX_ADMIN_URL || 'http://localhost:9180';
const APISIX_ADMIN_KEY = process.env.APISIX_ADMIN_KEY || 'apisixforge-admin-key';

export async function GET() {
  try {
    const data = await getRoutes();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { uri, upstream, upstreamType, methods, plugins, priority } = await req.json();

    if (!uri || !upstream) {
      return NextResponse.json({ error: 'URI and upstream are required' }, { status: 400 });
    }

    const body: Record<string, unknown> = {
      uri,
      priority: priority ?? 0,
      upstream: {
        type: upstreamType || 'roundrobin',
        nodes: { [upstream]: 1 },
      },
    };

    // Only include methods if specified
    if (methods && methods.length > 0) {
      body.methods = methods;
    }

    // Only include plugins if any selected
    if (plugins && Object.keys(plugins).length > 0) {
      body.plugins = plugins;
    }

    console.log('Creating route with body:', JSON.stringify(body, null, 2));
    const res = await fetch(`${APISIX_ADMIN_URL}/apisix/admin/routes`, {
      method: 'POST',
      headers: {
        'X-API-KEY': APISIX_ADMIN_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    

    const data = await res.json();
    console.log('APISIX response:', JSON.stringify(data, null, 2));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
  }
}

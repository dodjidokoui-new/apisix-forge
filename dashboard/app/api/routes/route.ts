import { NextResponse } from 'next/server';
import { getRoutes, createRoute } from '@/lib/apisix';

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
    const { name, uri, upstream, upstreamType, methods, plugins, priority } = await req.json();

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

    if (name) body.name = name;
    if (methods && methods.length > 0) body.methods = methods;
    if (plugins && Object.keys(plugins).length > 0) body.plugins = plugins;

    const data = await createRoute(body);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
  }
}

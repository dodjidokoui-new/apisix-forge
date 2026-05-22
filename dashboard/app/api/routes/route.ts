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
    const { uri, upstream } = await req.json();
    const data = await createRoute({
      uri,
      upstream: {
        type: 'roundrobin',
        nodes: { [upstream]: 1 },
      },
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { deleteRoute } from '@/lib/apisix';

const APISIX_ADMIN_URL = process.env.APISIX_ADMIN_URL || 'http://localhost:9180';
const APISIX_ADMIN_KEY = process.env.APISIX_ADMIN_KEY || 'apisixforge-admin-key';

const headers = {
  'X-API-KEY': APISIX_ADMIN_KEY,
  'Content-Type': 'application/json',
};

// Full route update
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { uri, upstream, upstreamType, methods, plugins, priority } = await req.json();

    const body: Record<string, unknown> = {
      uri,
      priority: priority ?? 0,
      upstream: {
        type: upstreamType || 'roundrobin',
        nodes: { [upstream]: 1 },
      },
    };

    if (methods && methods.length > 0) body.methods = methods;
    if (plugins && Object.keys(plugins).length > 0) body.plugins = plugins;

    const res = await fetch(`${APISIX_ADMIN_URL}/apisix/admin/routes/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
  }
}

// Partial update — used for enable/disable
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const res = await fetch(`${APISIX_ADMIN_URL}/apisix/admin/routes/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to patch route' }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await deleteRoute(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
  }
}

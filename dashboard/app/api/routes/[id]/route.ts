import { NextResponse } from 'next/server';
import { updateRoute, patchRoute, deleteRoute } from '@/lib/apisix';

type RouteParams = { params: Promise<{ id: string }> };

/** Full route replacement. */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { name, uri, upstream, upstreamType, methods, plugins, priority } = await req.json();

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

    const data = await updateRoute(id, body);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
  }
}

/** Partial route update — used for enable/disable status toggle. */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const data = await patchRoute(id, body);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to patch route' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await deleteRoute(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
  }
}

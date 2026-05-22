import { NextResponse } from 'next/server';
import { deleteRoute } from '@/lib/apisix';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await deleteRoute(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
  }
}

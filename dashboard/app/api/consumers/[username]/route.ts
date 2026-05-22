import { NextResponse } from 'next/server';
import { deleteConsumer } from '@/lib/apisix';

export async function DELETE(_: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const data = await deleteConsumer(username);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to delete consumer' }, { status: 500 });
  }
}

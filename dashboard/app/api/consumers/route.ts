import { NextResponse } from 'next/server';
import { getConsumers, upsertConsumer } from '@/lib/apisix';
import { randomBytes } from 'crypto';

const SUPPORTED_AUTH_TYPES = ['key-auth', 'jwt-auth'] as const;
type AuthType = typeof SUPPORTED_AUTH_TYPES[number];

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
    const { username, authType, options } = await req.json();

    // APISIX only allows alphanumeric and underscores
    if (typeof username !== 'string' || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must only contain letters, numbers and underscores' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_AUTH_TYPES.includes(authType as AuthType)) {
      return NextResponse.json(
        { error: `Unsupported auth type. Must be one of: ${SUPPORTED_AUTH_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const plugins: Record<string, unknown> = {};
    const credentials: { type: string; key?: string; secret?: string } = { type: authType };

    if (authType === 'key-auth') {
      const apiKey = randomBytes(24).toString('hex');
      plugins['key-auth'] = {
        key: apiKey,
        header: options?.header ?? 'apikey',
      };
      credentials.key = apiKey;
    } else if (authType === 'jwt-auth') {
      const secret = randomBytes(32).toString('hex');
      plugins['jwt-auth'] = {
        key: username,
        secret,
        algorithm: options?.algorithm ?? 'HS256',
        exp: options?.exp ?? 86400,
        header: options?.header ?? 'Authorization',
      };
      credentials.key = username;
      credentials.secret = secret;
    }

    const data = await upsertConsumer({ username, plugins });
    if (data.error_msg) {
      return NextResponse.json({ error: data.error_msg }, { status: 400 });
    }

    // Return credentials so the UI can display them once — they are not persisted server-side
    return NextResponse.json({ ...data, credentials });
  } catch {
    return NextResponse.json({ error: 'Failed to create consumer' }, { status: 500 });
  }
}

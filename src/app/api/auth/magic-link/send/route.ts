import { NextResponse } from 'next/server';
import { workos } from '@/lib/workos';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const session = await workos.passwordless.createSession({
      email,
      type: 'MagicLink',
      redirectURI: `${origin}/api/auth/callback`,
      expiresIn: 900,
    });

    await workos.passwordless.sendSession(session.id);

    return NextResponse.json({ success: true, sessionId: session.id });
  } catch (err) {
    console.error('Magic link error:', err);
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
  }
}
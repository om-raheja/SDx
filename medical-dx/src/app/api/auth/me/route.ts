import { NextResponse } from 'next/server';

export async function GET() {
  const userCookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  };

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const userStr = cookieStore.get('scalekit_user')?.value;

    if (!userStr) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = JSON.parse(userStr);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
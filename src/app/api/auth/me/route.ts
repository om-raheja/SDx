import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const userStr = cookieStore.get('session')?.value;

    if (!userStr) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = JSON.parse(userStr);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
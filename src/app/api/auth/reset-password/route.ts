import { NextResponse } from 'next/server';
import { workos } from '@/lib/workos';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    await workos.userManagement.createPasswordReset({
      email,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}

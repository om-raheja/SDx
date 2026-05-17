import { NextResponse } from 'next/server';
import { workos } from '@/lib/workos';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 });
    }

    await workos.userManagement.resetPassword({
      token,
      newPassword: password,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password confirm error:', err);
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }
}

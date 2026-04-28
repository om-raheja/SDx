import { NextResponse } from 'next/server';
import { workos } from '@/lib/workos';

const workosAny = workos as any;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { user } = await workosAny.userManagement.authenticateWithPassword({
      email,
      password,
    });

    const userData = {
      id: user.id,
      email: user.email,
      name: user.firstName + ' ' + user.lastName,
    };

    const response = NextResponse.json({ success: true, user: userData });
    response.cookies.set('session', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }
}
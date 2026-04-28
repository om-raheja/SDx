import { NextResponse } from 'next/server';
import { workos } from '@/lib/workos';

const workosAny = workos as any;

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await workosAny.userManagement.createUser({
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      emailVerified: true,
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
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
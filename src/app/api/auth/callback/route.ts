import { NextResponse } from 'next/server';
import { workos } from '@/lib/workos';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/auth/signin?error=' + error, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/signin?error=no_code', request.url));
  }

  try {
    const workosAny: any = workos;
    const authResponse = await workosAny.userManagement.authenticateWithCode({
      code,
    });
    const sourceUser = authResponse?.user || authResponse?.profile;

    if (!sourceUser?.id || !sourceUser?.email) {
      return NextResponse.redirect(new URL('/auth/signin?error=invalid_user', request.url));
    }

    const firstName = sourceUser.firstName || '';
    const lastName = sourceUser.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    const user = {
      id: sourceUser.id,
      email: sourceUser.email,
      name: fullName || sourceUser.email,
    };

    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('session', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', request.url));
  }
}

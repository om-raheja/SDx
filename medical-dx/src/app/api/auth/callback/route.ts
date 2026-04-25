import { NextResponse } from 'next/server';
import { authenticateWithCode } from '@/lib/scalekit';

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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
    const result = await authenticateWithCode(code, redirectUri);
    
    // Create a simple cookie-based session
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // Set a simple session cookie
    response.cookies.set('scalekit_user', JSON.stringify({
      id: result.user.id,
      email: result.user.email,
      name: result.user.displayName,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', request.url));
  }
}
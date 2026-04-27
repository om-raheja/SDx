import { NextResponse } from 'next/server';
import { authenticateWithCode } from '@/lib/scalekit';
import pool from '@/lib/db';

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const origin = new URL(request.url).origin;

  if (error) {
    return NextResponse.redirect(new URL('/auth/signin?error=' + error, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/signin?error=no_code', request.url));
  }

  try {
    const redirectUri = `${origin}/api/auth/callback`;
    const result = await authenticateWithCode(code, redirectUri);
    
    const userId = result.user.id;
    const email = result.user.email;
    const name = result.user.name;
    const role = TEACHER_EMAILS.includes(email) ? 'teacher' : 'student';

    await pool.query(`
      INSERT INTO users (id, email, name, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET email = $2, name = $3
    `, [userId, email, name, role]);
    
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('scalekit_user', JSON.stringify({
      id: userId,
      email,
      name,
      role,
    }), {
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
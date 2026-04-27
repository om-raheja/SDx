import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

const authRequestEmails = new Map<string, string>();

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${process.env.SCALEKIT_ENVIRONMENT_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SCALEKIT_CLIENT_ID!,
      client_secret: process.env.SCALEKIT_CLIENT_SECRET!,
      scope: 'openid profile email',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function saveUser(userId: string, email: string, name: string, role: string) {
  try {
    await pool.query(`
      INSERT INTO users (id, email, name, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET email = $2, name = $3
    `, [userId, email, name, role]);
  } catch (err) {
    console.error('Failed to save user:', err);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const linkToken = searchParams.get('link_token');
  const authRequestId = searchParams.get('auth_request_id');

  if (!linkToken || !authRequestId) {
    return NextResponse.redirect(new URL('/auth/signin?error=invalid_token', request.url));
  }

  try {
    const accessToken = await getAccessToken();
    const res = await fetch(
      `${process.env.SCALEKIT_ENVIRONMENT_URL}/api/v1/passwordless/email/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          link_token: linkToken,
          auth_request_id: authRequestId,
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.redirect(new URL('/auth/signin?error=invalid_token', request.url));
    }

    const data = await res.json();
    const userId = data.user?.id || `magic_${Date.now()}`;
    const email = authRequestEmails.get(authRequestId) || data.user?.email || 'unknown';
    authRequestEmails.delete(authRequestId);
    const name = data.user?.name || email;
    const role = TEACHER_EMAILS.includes(email) ? 'teacher' : 'student';

    await saveUser(userId, email, name, role);

    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('scalekit_user', JSON.stringify({ id: userId, email, name, role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.redirect(new URL('/auth/signin?error=verify_failed', request.url));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, auth_request_id, email: providedEmail } = body;
    
    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const res = await fetch(
      `${process.env.SCALEKIT_ENVIRONMENT_URL}/api/v1/passwordless/email/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          code,
          auth_request_id,
        }),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error: error.message || 'Failed to verify' }, { status: 400 });
    }

    const data = await res.json();
    let email = authRequestEmails.get(auth_request_id) || 
                authRequestEmails.get(`${auth_request_id}:${providedEmail}`) || 
                providedEmail ||
                data.user?.email || 
                'unknown';
    if (auth_request_id) {
      authRequestEmails.delete(auth_request_id);
      authRequestEmails.delete(`${auth_request_id}:${providedEmail}`);
    }
    // Use consistent user ID based on email hash for magic link users
    const userId = data.user?.id || `user_${Buffer.from(email).toString('base64').slice(0, 20)}`;
    const name = data.user?.name || email;
    const role = TEACHER_EMAILS.includes(email) ? 'teacher' : 'student';
    console.log('Verified email:', email, 'role:', role);

    await saveUser(userId, email, name, role);

    const response = NextResponse.json({ success: true, email, role });
    response.cookies.set('scalekit_user', JSON.stringify({ id: userId, email, name, role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
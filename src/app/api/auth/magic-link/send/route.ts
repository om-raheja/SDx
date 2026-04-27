import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const magicLinkAuthUri = `${origin}/auth/magic-link/verify`;

    const accessToken = await getAccessToken();

    const res = await fetch(`${process.env.SCALEKIT_ENVIRONMENT_URL}/api/v1/passwordless/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        email,
        expires_in: 300,
        template: 'SIGNIN',
        magiclink_auth_uri: magicLinkAuthUri,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('ScaleKit error:', error);
      return NextResponse.json({ error: error.message || 'Failed to send' }, { status: 400 });
    }

    const data = await res.json();
    
    // Store email with auth_request_id for later lookup
    if (data.auth_request_id) {
      authRequestEmails.set(data.auth_request_id, email);
      setTimeout(() => authRequestEmails.delete(data.auth_request_id), 300000);
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error('Magic link error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
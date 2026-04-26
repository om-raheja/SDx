import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/scalekit';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;
  const authUrl = getAuthorizationUrl(redirectUri, process.env.SCALEKIT_ORG_ID, 'google');
  return NextResponse.redirect(authUrl);
}
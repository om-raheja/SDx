import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/scalekit';

const TEACHER_EMAIL = 'soniasethi66@hotmail.com';

export async function GET() {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
  const authUrl = getAuthorizationUrl(redirectUri, process.env.SCALEKIT_ORG_ID);
  return NextResponse.redirect(authUrl);
}
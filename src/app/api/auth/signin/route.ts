import { NextResponse } from 'next/server';
import { workos } from '@/lib/workos';

const ALLOWED_PROVIDERS = new Set([
  'GoogleOAuth',
  'MicrosoftOAuth',
  'AppleOAuth',
  'GitHubOAuth',
  'SalesforceOAuth',
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider || !ALLOWED_PROVIDERS.has(provider)) {
      return NextResponse.redirect(new URL('/auth/signin?error=invalid_provider', request.url));
    }

    const redirectUri = `${new URL(request.url).origin}/api/auth/callback`;
    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      provider,
      redirectUri,
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (err) {
    console.error('SSO signin error:', err);
    return NextResponse.redirect(new URL('/auth/signin?error=sso_init_failed', request.url));
  }
}

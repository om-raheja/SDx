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
    const connectionId = searchParams.get('connection_id');

    if (!connectionId && (!provider || !ALLOWED_PROVIDERS.has(provider))) {
      return NextResponse.redirect(new URL('/auth/signin?error=invalid_provider', request.url));
    }

    const redirectUri = `${new URL(request.url).origin}/api/auth/callback`;
    const providerValue = provider || undefined;
    const authorizationUrl = connectionId
      ? workos.userManagement.getAuthorizationUrl({
          connectionId,
          redirectUri,
        })
      : workos.userManagement.getAuthorizationUrl({
          provider: providerValue,
          redirectUri,
        });

    return NextResponse.redirect(authorizationUrl);
  } catch (err) {
    console.error('SSO signin error:', err);
    return NextResponse.redirect(new URL('/auth/signin?error=sso_init_failed', request.url));
  }
}

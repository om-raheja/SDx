import { NextResponse } from 'next/server';
import { workos } from '@/lib/workos';

const workosAny = workos as any;
const OAUTH_PROVIDERS = new Set(['GoogleOAuth', 'MicrosoftOAuth', 'AppleOAuth', 'GitHubOAuth', 'SalesforceOAuth']);

async function detectOAuthProviderByEmail(email: string): Promise<string | null> {
  try {
    const usersResult = await workosAny.userManagement.listUsers({ email });
    const users = usersResult?.data || [];
    const targetUser = users.find((u: any) => String(u?.email || '').toLowerCase() === email.toLowerCase());
    if (!targetUser?.id) return null;

    const identities = await workosAny.userManagement.getUserIdentities(targetUser.id);
    const oauthIdentity = (identities || []).find((identity: any) => OAUTH_PROVIDERS.has(identity?.provider));
    return oauthIdentity?.provider || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let email = '';
  try {
    const body = await request.json();
    email = body.email || '';
    const { password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { user } = await workosAny.userManagement.authenticateWithPassword({
      email,
      password,
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
    console.error('Login error:', err);
    const errorCode = (err as any)?.code || (err as any)?.rawData?.code || (err as any)?.rawData?.error;
    const errorDescription = String((err as any)?.rawData?.error_description || '').toLowerCase();
    const connectionIds = (err as any)?.rawData?.connection_ids;
    const connectionId = Array.isArray(connectionIds) ? connectionIds[0] : undefined;

    if (errorCode === 'sso_required' || errorDescription.includes('sso')) {
      return NextResponse.json(
        {
          error: 'This account uses Google/Microsoft sign-in. Redirecting you to SSO...',
          ssoRequired: true,
          connectionId,
        },
        { status: 409 }
      );
    }

    if (email) {
      const provider = await detectOAuthProviderByEmail(email);
      if (provider) {
        return NextResponse.json(
          {
            error: `This account uses ${provider.replace('OAuth', '')} sign-in. Redirecting you to SSO...`,
            ssoRequired: true,
            provider,
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }
}

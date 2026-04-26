import { ScalekitClient } from '@scalekit-sdk/node';

let scalekit: ScalekitClient | null = null;

const getScalekitClient = () => {
  if (!scalekit) {
    scalekit = new ScalekitClient(
      process.env.SCALEKIT_ENVIRONMENT_URL!,
      process.env.SCALEKIT_CLIENT_ID!,
      process.env.SCALEKIT_CLIENT_SECRET!
    );
  }
  return scalekit;
};

export const getAuthorizationUrl = (redirectUri: string, organizationId?: string, provider?: string) => {
  const options: any = {};
  if (organizationId) {
    options.organizationId = organizationId;
  }
  if (provider) {
    options.provider = provider;
  }
  return getScalekitClient().getAuthorizationUrl(redirectUri, options);
};

export const authenticateWithCode = (code: string, redirectUri: string) => {
  return getScalekitClient().authenticateWithCode(code, redirectUri);
};
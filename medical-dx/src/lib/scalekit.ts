import { ScalekitClient } from '@scalekit-sdk/node';

const scalekit = new ScalekitClient(
  process.env.SCALEKIT_ENVIRONMENT_URL!,
  process.env.SCALEKIT_CLIENT_ID!,
  process.env.SCALEKIT_CLIENT_SECRET!
);

export const getAuthorizationUrl = (redirectUri: string, organizationId?: string, provider?: string) => {
  const options: any = {};
  if (organizationId) {
    options.organizationId = organizationId;
  }
  if (provider) {
    options.provider = provider;
  }
  return scalekit.getAuthorizationUrl(redirectUri, options);
};

export const authenticateWithCode = (code: string, redirectUri: string) => {
  return scalekit.authenticateWithCode(code, redirectUri);
};

export const scalekitClient = scalekit;
export default scalekit;
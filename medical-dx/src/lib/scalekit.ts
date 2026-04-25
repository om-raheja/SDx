import { ScalekitClient } from '@scalekit-sdk/node';

const scalekit = new ScalekitClient(
  process.env.SCALEKIT_ENVIRONMENT_URL!,
  process.env.SCALEKIT_CLIENT_ID!,
  process.env.SCALEKIT_CLIENT_SECRET!
);

export const getAuthorizationUrl = (redirectUri: string, organizationId?: string) => {
  const options: any = {};
  if (organizationId) {
    options.organizationId = organizationId;
  }
  return scalekit.getAuthorizationUrl(redirectUri, options);
};

export const authenticateWithCode = (code: string, redirectUri: string) => {
  return scalekit.authenticateWithCode(code, redirectUri);
};

export const scalekitClient = scalekit;
export default scalekit;
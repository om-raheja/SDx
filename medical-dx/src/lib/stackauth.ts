import { StackServerApp, useUser as useStackUser } from "@stackframe/stack";

let _app: ReturnType<typeof StackServerApp> | null = null;

function getApp() {
  if (_app) return _app;
  
  const pid = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const secret = process.env.STACK_SECRET_SERVER_KEY;
  
  if (!pid || !secret) {
    console.warn("Missing StackAuth credentials");
    return null;
  }
  
  try {
    _app = new StackServerApp({
      projectId: pid,
      publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "",
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://medical-dx.vercel.app",
      tokenStore: "nextjs-cookie",
      secretServerKey: secret,
    });
    return _app;
  } catch (e) {
    console.warn("StackAuth init error:", e);
    return null;
  }
}

export const stackServerApp = {
  useUser(): any { 
    const app = getApp();
    if (!app) return () => null;
    return app.useUser();
  },
  getUser() { 
    return getApp()?.getUser() ?? Promise.resolve(null);
  },
  handler(req: Request) {
    return getApp()?.handler(req) ?? new Response("Auth not configured");
  },
  run(req: Request) {
    return getApp()?.run(req) ?? Promise.resolve(new Response("Auth not configured"));
  }
};

export function useUser() {
  return null; // Client-side will use StackProvider
}
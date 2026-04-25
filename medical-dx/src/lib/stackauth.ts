let app: any = null;

function getApp() {
  if (app) return app;
  
  const { StackServerApp } = require("@stackframe/stack");
  const pid = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const secret = process.env.STACK_SECRET_SERVER_KEY;
  
  if (!pid || !secret) return null;
  
  try {
    app = new StackServerApp({
      projectId: pid,
      publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "",
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://medical-dx.vercel.app",
      tokenStore: "nextjs-cookie",
      secretServerKey: secret,
    });
    return app;
  } catch (e) {
    console.warn("StackAuth init error:", e);
    return null;
  }
}

export const stackServerApp = {
  useUser() { return () => null; },
  getUser() { return getApp()?.getUser?.() ?? Promise.resolve(null); },
  handler(req: Request) { return getApp()?.handler?.(req) ?? new Response(""); },
  run(req: Request) { return getApp()?.run?.(req) ?? Promise.resolve(new Response("")); }
};
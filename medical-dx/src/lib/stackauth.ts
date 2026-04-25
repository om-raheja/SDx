import { StackServerApp, useUser as useStackUser } from "@stackframe/stack";

export type { CurrentUser, CurrentServerUser, StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "",
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  tokenStore: "cookie",
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY || "",
});

export function useUser() {
  return useStackUser();
}
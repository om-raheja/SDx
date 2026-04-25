"use client";

import { StackProvider, StackTheme, UserButton, useUser } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stackauth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackServerApp as any}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  );
}

export { UserButton, useUser };
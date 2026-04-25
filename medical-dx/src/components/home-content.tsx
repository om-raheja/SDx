"use client";

import { UserButton, useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomeContent() {
  const user = useUser({ or: 'return-null' });
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (user === null) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
        <main className="flex flex-col items-center gap-8 py-16 px-8 max-w-lg w-full">
          <h1 className="text-4xl font-semibold text-center text-zinc-900 dark:text-zinc-50">
            Medical Diagnosis Practice
          </h1>
          <p className="text-lg text-center text-zinc-600 dark:text-zinc-400">
            Practice diagnostic reasoning through step-by-step case hints
          </p>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <UserButton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <p className="text-zinc-600 dark:text-zinc-400">Redirecting...</p>
    </div>
  );
}
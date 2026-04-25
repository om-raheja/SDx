"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (isLoaded && user) {
    router.push('/dashboard');
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 min-h-screen">
      <header className="flex justify-end items-center p-4 gap-4 absolute top-0 right-0">
        <SignInButton>
          <button className="px-4 py-2 bg-zinc-100 rounded-lg">Sign In</button>
        </SignInButton>
        <SignUpButton>
          <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg">Sign Up</button>
        </SignUpButton>
      </header>
      <main className="flex flex-col items-center gap-8 py-16 px-8 max-w-lg">
        <h1 className="text-4xl font-semibold text-center text-zinc-900">
          Medical Diagnosis Practice
        </h1>
        <p className="text-lg text-center text-zinc-600">
          Practice diagnostic reasoning through step-by-step case hints
        </p>
      </main>
    </div>
  );
}
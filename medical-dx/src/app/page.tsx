"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    setLoading(true);
    setTimeout(() => router.push('/dashboard'), 500);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans min-h-screen">
      <main className="flex flex-col items-center gap-8 py-16 px-8 max-w-lg w-full">
        <h1 className="text-4xl font-semibold text-center text-zinc-900">
          Medical Diagnosis Practice
        </h1>
        <p className="text-lg text-center text-zinc-600">
          Practice diagnostic reasoning through step-by-step case hints
        </p>
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="px-6 py-3 bg-zinc-900 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? "Loading..." : "Sign In with Google"}
        </button>
        <p className="text-sm text-zinc-500">(Demo mode - auth coming soon)</p>
      </main>
    </div>
  );
}
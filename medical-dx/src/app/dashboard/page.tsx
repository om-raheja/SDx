"use client";

import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Medical Diagnosis Cases
        </h1>
        <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          Sign Out
        </button>
      </header>
      <main className="max-w-4xl mx-auto py-8 px-6">
        <p className="text-zinc-600">No cases available yet. Check back later!</p>
      </main>
    </div>
  );
}
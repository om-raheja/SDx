"use client";

import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const handleSignOut = () => router.push('/');

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200">
        <h1 className="text-xl font-semibold text-zinc-900">Medical Diagnosis Cases</h1>
        <button onClick={handleSignOut} className="px-4 py-2 bg-zinc-100 rounded-lg">Sign Out</button>
      </header>
      <main className="max-w-4xl mx-auto py-8 px-6">
        <p className="text-zinc-600">No cases available yet. Check back later!</p>
      </main>
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";

export default function CaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center px-6 py-4 bg-white border-b">
        <button onClick={() => router.push("/dashboard")} className="text-zinc-600">← Back</button>
      </header>
      <main className="max-w-3xl mx-auto py-8 px-6">
        <p className="text-zinc-600">Case details loading...</p>
      </main>
    </div>
  );
}

"use client";

import { UserButton, useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const user = useUser({ or: 'return-null' });
  const router = useRouter();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) {
      router.push('/handler/signin');
      return;
    }
    
    if (user) {
      fetch("/api/cases")
        .then(res => res.json())
        .then(data => setCases(data))
        .catch(() => setCases([]))
        .finally(() => setLoading(false));
    }
  }, [user, router]);

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Medical Diagnosis Cases
        </h1>
        <UserButton />
      </header>
      <main className="max-w-4xl mx-auto py-8 px-6">
        {loading ? (
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        ) : cases.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No cases available yet.</p>
        ) : (
          <div className="grid gap-4">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/dashboard/${c.id}`)}
                className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors text-left"
              >
                <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{c.title}</span>
                <span className="text-zinc-500 dark:text-zinc-400">→</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
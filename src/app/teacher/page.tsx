"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TEACHER_EMAIL = 'soniasethi66@hotmail.com';

export default function Teacher() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }

    fetch("/api/auth/me")
      .then(res => res.json())
      .then(userData => {
        if (userData.error) {
          router.push('/auth/signin');
          return;
        }
        setUser(userData);
        if (userData.email !== TEACHER_EMAIL) {
          router.push('/dashboard');
          return;
        }
        fetch("/api/submissions")
          .then(res => res.json())
          .then(data => setSubmissions(Array.isArray(data) ? data : []))
          .catch(() => {});
      });
  }, [router]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark");
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push('/auth/signin');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Teacher Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <button 
            onClick={() => router.push('/teacher/create')}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg"
          >
            Create Case
          </button>
          <button onClick={handleSignOut} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 dark:text-white rounded-lg">
            Sign Out
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-8 px-6">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">Student Submissions</h2>
        {submissions.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((s: any) => (
              <div key={s.id} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-zinc-900 dark:text-white">Student</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{new Date(s.created_at).toLocaleString()}</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300">Case: {s.case_title || 'Unknown'}</p>
                <p className="text-zinc-600 dark:text-zinc-300">Diagnosis: {s.diagnosis}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">After Hint {s.submitted_after_hint} {s.is_final && "(Final)"}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
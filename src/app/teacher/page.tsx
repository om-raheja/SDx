"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

export default function Teacher() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
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
        if (!TEACHER_EMAILS.includes(userData.email)) {
          router.push('/dashboard');
          return;
        }
        fetch("/api/submissions")
          .then(res => res.json())
          .then(data => setSubmissions(Array.isArray(data) ? data : []))
          .catch(() => {});
        
        // Also fetch cases for the list
        fetch("/api/cases")
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setCases(data);
            }
          })
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
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">Cases</h2>
        {cases.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">No cases yet. Create your first case!</p>
        ) : (
          <div className="grid gap-4 mb-8">
            {cases.map((c: any) => (
              <button
                key={c.id}
                onClick={() => router.push(`/teacher/cases/${c.id}`)}
                className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 text-left"
              >
                <span className="text-lg font-medium text-zinc-900 dark:text-white">{c.title}</span>
                <span className="text-zinc-500 dark:text-zinc-400">{new Date(c.created_at).toLocaleString()} →</span>
              </button>
            ))}
          </div>
        )}

        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">Recent Submissions</h2>
        {submissions.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No submissions yet.</p>
        ) : (() => {
          // Group by student + case
          const grouped = submissions.reduce((acc: Record<string, any>, s: any) => {
            const key = `${s.student_email || s.user_email || 'unknown'}-${s.case_id}`;
            if (!acc[key]) {
              acc[key] = {
                email: s.student_email || s.user_email || 'unknown',
                case_title: s.case_title || 'Unknown',
                case_id: s.case_id,
                submissions: [],
                created_at: s.created_at,
              };
            }
            acc[key].submissions.push(s);
            // Update timestamp to latest
            if (new Date(s.created_at) > new Date(acc[key].created_at)) {
              acc[key].created_at = s.created_at;
            }
            return acc;
          }, {});
          
          return (
            <div className="space-y-6">
              {Object.values(grouped).map((g: any) => (
                <div key={`${g.email}-${g.case_id}`} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 relative">
                  <button
                    onClick={() => {
                      fetch(`/api/cases/${g.case_id}/submissions`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: g.submissions[0]?.user_id }),
                      }).then(() => window.location.reload());
                    }}
                    className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="flex justify-between items-start mb-3 pr-10">
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">{g.email}</h3>
                      <p className="text-sm text-zinc-500">{g.case_title}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-400">
                        {g.submissions.filter((s: any) => s.is_final).length > 0 ? '✓ Complete' : `${g.submissions.length}/7`}
                      </span>
                      <p className="text-xs text-zinc-400">{new Date(g.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[1,2,3,4,5,6,7].map(hintNum => {
                      const sub = g.submissions.find((s: any) => s.submitted_after_hint === hintNum);
                      return (
                        <div key={hintNum} className="flex items-start gap-2 text-sm p-2 rounded bg-zinc-50 dark:bg-zinc-800">
                          <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-medium min-w-[50px] text-center">
                            H{hintNum}
                          </span>
                          {sub ? (
                            <span className="text-zinc-700 dark:text-zinc-300">{sub.diagnosis}</span>
                          ) : (
                            <span className="text-zinc-400 italic">pending</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </main>
    </div>
  );
}
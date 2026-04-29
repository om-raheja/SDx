"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
}

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }

    Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/cases"),
    ])
      .then(([userRes, casesRes]) => Promise.all([userRes.json(), casesRes.json()]))
      .then(([userData, casesData]) => {
        if (userData.error) {
          router.push('/auth/signin');
          return;
        }
        setUser({ id: userData.id, email: userData.email, name: userData.name });
        setCases(Array.isArray(casesData) ? casesData : []);
        // Fetch user's past submissions
        fetch("/api/auth/me/submissions")
          .then(res => res.json())
          .then(subData => {
            if (Array.isArray(subData)) {
              setUserSubmissions(subData);
            }
          })
          .catch(() => {});
      })
      .catch(() => router.push('/auth/signin'))
      .finally(() => setLoading(false));
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

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Loading...</div>;
  }

  const isTeacher = TEACHER_EMAILS.includes(user.email);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">SDx Lab {isTeacher && <span className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-2 py-0.5 rounded ml-2">Teacher</span>}</h1>
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
          {isTeacher && (
            <button 
              onClick={() => router.push('/teacher')}
              className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg"
            >
              Teacher
            </button>
          )}
          <button onClick={handleSignOut} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 dark:text-white rounded-lg">
            Sign Out
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-8 px-6">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">Available Cases</h2>
        {isTeacher && (
          <button
            onClick={() => router.push('/teacher/create')}
            className="w-full mb-6 p-6 bg-white dark:bg-zinc-900 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-400 flex items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-lg font-medium">Create New Case</span>
          </button>
        )}
        {cases.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No cases available yet.</p>
        ) : (
          <div className="grid gap-4">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/dashboard/${c.id}`)}
                className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 text-left"
              >
                <span className="text-lg font-medium text-zinc-900 dark:text-white">{c.title}</span>
                <span className="text-zinc-500 dark:text-zinc-400">→</span>
              </button>
            ))}
          </div>
        )}
      </main>

      {userSubmissions.length > 0 && (
        <main className="max-w-4xl mx-auto py-8 px-6">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">Your Past Submissions</h2>
          {(() => {
            const grouped = userSubmissions.reduce((acc: Record<string, any>, s: any) => {
              const key = s.case_id;
              if (!acc[key]) {
                acc[key] = {
                  case_title: s.case_title || 'Unknown',
                  case_id: s.case_id,
                  submissions: [],
                  created_at: s.created_at,
                };
              }
              acc[key].submissions.push(s);
              if (new Date(s.created_at) > new Date(acc[key].created_at)) {
                acc[key].created_at = s.created_at;
              }
              return acc;
            }, {});
            
            return (
              <div className="space-y-6">
                {Object.values(grouped).map((g: any) => (
                  <div key={g.case_id} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-zinc-900 dark:text-white">{g.case_title}</h3>
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
                              <div className="flex-1">
                                <span className="text-zinc-700 dark:text-zinc-300">{sub.diagnosis}</span>
                                {sub.teacher_comments?.length > 0 && (
                                  <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">Teacher feedback:</span>
                                    {sub.teacher_comments.map((c: any) => (
                                      <p key={c.id} className="text-blue-700 dark:text-blue-300">{c.comment}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
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
      )}
    </div>
  );
}
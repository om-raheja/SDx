
"use client";

import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TEACHER_EMAIL = "soniasethi66@hotmail.com";

export default function TeacherDashboard() {
  const user = useUser({ or: 'return-null' });
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.primaryEmail !== TEACHER_EMAIL) {
      router.push("/dashboard");
      return;
    }
    
    if (user && user.primaryEmail === TEACHER_EMAIL) {
      fetch("/api/submissions")
        .then(res => res.json())
        .then(data => setSubmissions(data))
        .finally(() => setLoading(false));
    }
  }, [user, router]);

  if (!user || user.primaryEmail !== TEACHER_EMAIL) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Teacher Dashboard
        </h1>
        <a
          href="/teacher/create"
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg"
        >
          Create Case
        </a>
      </header>
      
      <main className="max-w-4xl mx-auto py-8 px-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
          Student Submissions
        </h2>
        
        {loading ? (
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        ) : submissions.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {s.student_name || s.student_email}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {new Date(s.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  <strong>Case:</strong> {s.case_title}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  <strong>Diagnosis:</strong> {s.diagnosis}
                </p>
                <p className="text-sm text-zinc-500">
                  After Hint {s.submitted_after_hint} {s.is_final && "(Final)"}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
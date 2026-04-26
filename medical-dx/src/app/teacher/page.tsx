"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TEACHER_EMAIL = 'soniasethi66@hotmail.com';

export default function Teacher() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const userStr = cookies['scalekit_user'];
    if (!userStr) {
      router.push('/auth/signin');
      return;
    }

    try {
      const userData = JSON.parse(decodeURIComponent(userStr));
      setUser(userData);
      if (userData.email !== TEACHER_EMAIL) {
        router.push('/dashboard');
        return;
      }
    } catch {
      router.push('/auth/signin');
      return;
    }

    fetch("/api/submissions")
      .then(res => res.json())
      .then(data => setSubmissions(data))
      .catch(() => {});
  }, [router]);

  const handleSignOut = () => {
    document.cookie = 'scalekit_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/auth/signin');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200">
        <h1 className="text-xl font-semibold text-zinc-900">Teacher Dashboard</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/teacher/create')}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg"
          >
            Create Case
          </button>
          <button onClick={handleSignOut} className="px-4 py-2 bg-zinc-100 rounded-lg">
            Sign Out
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-8 px-6">
        {submissions.length === 0 ? (
          <p className="text-zinc-600">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((s: any) => (
              <div key={s.id} className="p-4 bg-white rounded-lg border border-zinc-200">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Student</span>
                  <span className="text-sm text-zinc-500">{new Date(s.created_at).toLocaleString()}</span>
                </div>
                <p className="text-zinc-600">Case: {s.case_title || 'Unknown'}</p>
                <p className="text-zinc-600">Diagnosis: {s.diagnosis}</p>
                <p className="text-sm text-zinc-500">After Hint {s.submitted_after_hint} {s.is_final && "(Final)"}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
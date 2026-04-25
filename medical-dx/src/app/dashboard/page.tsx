"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
}

const TEACHER_EMAIL = 'soniasethi66@hotmail.com';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      setUser(JSON.parse(decodeURIComponent(userStr)));
    } catch {
      router.push('/auth/signin');
      return;
    }

    fetch("/api/cases")
      .then(res => res.json())
      .then(data => setCases(data))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSignOut = () => {
    document.cookie = 'scalekit_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/auth/signin');
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const isTeacher = user.email === TEACHER_EMAIL;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200">
        <h1 className="text-xl font-semibold text-zinc-900">Medical Diagnosis Cases</h1>
        <div className="flex items-center gap-4">
          {isTeacher && (
            <button 
              onClick={() => router.push('/teacher')}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg"
            >
              Teacher
            </button>
          )}
          <button onClick={handleSignOut} className="px-4 py-2 bg-zinc-100 rounded-lg">
            Sign Out
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-8 px-6">
        {cases.length === 0 ? (
          <p className="text-zinc-600">No cases available yet.</p>
        ) : (
          <div className="grid gap-4">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/dashboard/${c.id}`)}
                className="flex items-center justify-between p-6 bg-white rounded-lg border border-zinc-200 hover:border-zinc-400 text-left"
              >
                <span className="text-lg font-medium text-zinc-900">{c.title}</span>
                <span className="text-zinc-500">→</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
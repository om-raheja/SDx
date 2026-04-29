"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Submission {
  id: string;
  diagnosis: string;
  submitted_after_hint: number;
  is_final: boolean;
  created_at: string;
  student_name: string;
  student_email: string;
}

export default function CaseDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [caseData, setCaseData] = useState<any>(null);
  const [hints, setHints] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/cases/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.case) {
          setCaseData(data.case);
          setHints(data.hints || []);
          setSubmissions(data.submissions || []);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this case and all submissions? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/teacher');
      } else {
        alert('Failed to delete case');
      }
    } catch {
      alert('Failed to delete case');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Loading...</div>;
  }

  if (!caseData) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Case not found</div>;
  }

  // Group submissions by student
  const studentSubmissions = submissions.reduce((acc, s) => {
    const key = s.student_email || 'unknown';
    if (!acc[key]) {
      acc[key] = { name: s.student_name, email: key, submissions: [] };
    }
    acc[key].submissions.push(s);
    return acc;
  }, {} as Record<string, { name: string; email: string; submissions: Submission[] }>);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <button onClick={() => router.push("/teacher")} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
          ← Back
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete Case'}
        </button>
      </header>
      
      <main className="max-w-4xl mx-auto py-8 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{caseData.title}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Created: {new Date(caseData.created_at).toLocaleString()}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Hints ({hints.length})</h2>
          {hints.length > 0 ? (
            <div className="space-y-3">
              {hints.map((h: any) => (
                <div key={h.id} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Hint {h.hint_order}</span>
                  {h.content && <p className="text-zinc-900 dark:text-zinc-200">{h.content}</p>}
                  {h.image_url && (
                    <img 
                      src={`/api/image?url=${encodeURIComponent(h.image_url)}`} 
                      alt={`Hint ${h.hint_order}`} 
                      className="mt-2 max-w-xs rounded border" 
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 dark:text-zinc-400">No hints yet.</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Student Progress ({Object.keys(studentSubmissions).length} students)
          </h2>
          
          {Object.keys(studentSubmissions).length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">No submissions yet.</p>
          ) : (
            <div className="space-y-6">
              {Object.values(studentSubmissions).map((student) => (
                <div key={student.email} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">{student.name || 'Unknown'}</h3>
                      <p className="text-sm text-zinc-500">{student.email}</p>
                    </div>
                    <span className="text-sm text-zinc-500">
                      {student.submissions.length} submission{student.submissions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {(() => {
                      const hintCount = hints.length || 7;
                      return [...Array(hintCount)].map((_, i) => {
                        const hintNum = i + 1;
                        const sub = student.submissions.find(s => s.submitted_after_hint === hintNum);
                      return (
                        <div key={hintNum} className="flex items-start gap-3 text-sm p-2 rounded bg-zinc-50 dark:bg-zinc-800/50">
                          <span className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded font-medium min-w-[60px] text-center">
                            Hint {hintNum}
                          </span>
                          {sub ? (
                            <div className="flex-1">
                              <span className="text-zinc-900 dark:text-zinc-200">{sub.diagnosis}</span>
                              {sub.is_final && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-400 rounded">Final</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-500 italic">No diagnosis</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
"use client";

import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Hint {
  id: string;
  hint_order: number;
  content: string;
  image_url: string | null;
  labs: string | null;
}

export default function CaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = { id: 'temp' }; // Will be fixed in client
  const user = useUser();
  const router = useRouter();
  const [hints, setHints] = useState<Hint[]>([]);
  const [currentHint, setCurrentHint] = useState(0);
  const [diagnosis, setDiagnosis] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get case ID from params
  const [caseId, setCaseId] = useState("");

  useEffect(() => {
    params.then(p => setCaseId(p.id));
  }, []);

  useEffect(() => {
    if (!user || !caseId) return;
    fetch(`/api/cases/${caseId}/hints`)
      .then(res => res.json())
      .then(data => setHints(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, caseId]);

  const handleSubmit = async (isFinal = false) => {
    if (!diagnosis.trim() || !caseId) return;
    try {
      await fetch(`/api/cases/${caseId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosis, submitted_after_hint: currentHint, is_final: isFinal })
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200">
        <button onClick={() => router.push("/dashboard")} className="text-zinc-600">← Back</button>
        <h1 className="ml-4 text-lg font-semibold">Hint {currentHint + 1} of 7</h1>
      </header>
      <main className="max-w-3xl mx-auto py-8 px-6">
        {hints[currentHint] && (
          <div className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200">
            <p className="text-lg text-zinc-900 dark:text-zinc-50">{hints[currentHint].content}</p>
            {hints[currentHint].image_url && (
              <img src={hints[currentHint].image_url!} alt="Hint" className="mt-4 max-w-full rounded" />
            )}
            {hints[currentHint].labs && (
              <pre className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded text-sm">{hints[currentHint].labs}</pre>
            )}
          </div>
        )}
        <input
          value={diagnosis}
          onChange={e => setDiagnosis(e.target.value)}
          placeholder="Enter diagnosis..."
          className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 mb-4"
        />
        <div className="flex gap-4">
          <button onClick={() => handleSubmit(false)} className="px-6 py-3 bg-zinc-900 text-white rounded-lg">
            Submit
          </button>
          <button 
            onClick={() => handleSubmit(true)} 
            disabled={currentHint < 6}
            className="px-6 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            Final Submit
          </button>
          {currentHint < 7 && (
            <button onClick={() => setCurrentHint(c => c + 1)} className="px-6 py-3 border border-zinc-300 rounded">
              Next Hint
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useUser } from "@stackframe/stack";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";

interface Hint {
  id: string;
  hint_order: number;
  content: string;
  image_url: string | null;
  labs: string | null;
}

interface Submission {
  id: string;
  diagnosis: string;
  submitted_after_hint: number;
  is_final: boolean;
}

export default function CaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const user = useUser({ or: 'return-null' });
  const router = useRouter();
  const [hints, setHints] = useState<Hint[]>([]);
  const [currentHint, setCurrentHint] = useState(0);
  const [diagnosis, setDiagnosis] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    
    Promise.all([
      fetch(`/api/cases/${resolvedParams.id}/hints`).then(res => res.json()),
      fetch(`/api/cases/${resolvedParams.id}/submissions`).then(res => res.json()).catch(() => [])
    ]).then(([hintsData, submissionsData]) => {
      setHints(hintsData);
      if (submissionsData && submissionsData.length > 0) {
        setSubmission(submissionsData[0]);
        setDiagnosis(submissionsData[0].diagnosis);
        setCurrentHint(submissionsData[0].submitted_after_hint);
      }
      setLoading(false);
    });
  }, [user, resolvedParams.id]);

  const handleSubmit = async (isFinal: boolean = false) => {
    if (!diagnosis.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/cases/${resolvedParams.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis,
          submitted_after_hint: currentHint,
          is_final: isFinal
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit");
        return;
      }
      
      const data = await res.json();
      setSubmission({
        id: data.submissionId,
        diagnosis,
        submitted_after_hint: currentHint,
        is_final: isFinal
      });
    } catch {
      setError("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const revealNextHint = () => {
    if (currentHint < 7) {
      setCurrentHint(currentHint + 1);
    }
  };

  if (!user || loading) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Case {currentHint + 1} of 7
        </h1>
      </header>
      
      <main className="max-w-3xl mx-auto py-8 px-6">
        {currentHint < hints.length && (
          <div className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Hint {currentHint + 1}
            </h2>
            <p className="text-lg text-zinc-900 dark:text-zinc-50 whitespace-pre-wrap">
              {hints[currentHint]?.content}
            </p>
            {hints[currentHint]?.image_url && (
              <img 
                src={hints[currentHint].image_url} 
                alt="Medical"
                className="mt-4 max-w-full rounded-lg"
              />
            )}
            {hints[currentHint]?.labs && (
              <div className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Labs</p>
                <pre className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                  {hints[currentHint].labs}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Your Diagnosis
          </label>
          {currentHint > 0 && submission && (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded mb-2">
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                After Hint {submission.submitted_after_hint}: <strong>{submission.diagnosis}</strong>
              </p>
            </div>
          )}
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter your diagnosis..."
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
          />
        </div>

        {error && (
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        )}

        <div className="flex gap-4">
          {currentHint < 7 && (
            <button
              onClick={() => handleSubmit()}
              disabled={submitting || !diagnosis.trim()}
              className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg disabled:opacity-50"
            >
              Submit Diagnosis
            </button>
          )}
          {currentHint < 7 ? (
            <button
              onClick={revealNextHint}
              className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300"
            >
              Reveal Next Hint
            </button>
          ) : (
<button
              onClick={() => handleSubmit(true)}
              disabled={submitting || !diagnosis.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50"
            >
              Submit Final Diagnosis
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
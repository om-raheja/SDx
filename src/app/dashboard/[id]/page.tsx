"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Hint {
  id: string;
  hint_order: number;
  content: string;
  image_url?: string;
  labs?: string;
}

export default function CaseDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [caseData, setCaseData] = useState<any>(null);
  const [hints, setHints] = useState<Hint[]>([]);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [diagnosis, setDiagnosis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedDiagnosis, setSubmittedDiagnosis] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }

    fetch(`/api/cases/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.case) {
          setCaseData(data.case);
          setHints(data.hints || []);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const currentHint = hints[currentHintIndex];

  const handleSubmitDiagnosis = async () => {
    if (!diagnosis.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cases/${id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: diagnosis.trim(),
          submitted_after_hint: currentHintIndex + 1,
          is_final: currentHintIndex === hints.length - 1,
        }),
      });
      if (res.ok) {
        setSubmittedDiagnosis(diagnosis);
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleNextHint = () => {
    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
      setDiagnosis("");
    }
  };

  const handlePrevHint = () => {
    if (currentHintIndex > 0) {
      setCurrentHintIndex(currentHintIndex - 1);
      setDiagnosis("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Loading case...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Case not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <button onClick={() => router.push("/dashboard")} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
          ← Back to Cases
        </button>
        <button
          onClick={() => {
            setDarkMode(!darkMode);
            localStorage.setItem('darkMode', String(!darkMode));
            document.documentElement.classList.toggle('dark');
          }}
          className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </header>
      
      <main className="max-w-3xl mx-auto py-8 px-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{caseData.title}</h1>
        
        <div className="mb-6">
          <span className="text-zinc-500 dark:text-zinc-400">
            Hint {currentHintIndex + 1} of {hints.length}
          </span>
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-2">
            <div 
              className="h-2 bg-zinc-900 dark:bg-white rounded-full transition-all"
              style={{ width: `${((currentHintIndex + 1) / hints.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Current Hint</h2>
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{currentHint?.content}</p>
            {currentHint?.image_url && (
              <img src={currentHint.image_url} alt="Case" className="mt-4 max-w-full rounded" />
            )}
            {currentHint?.labs && (
              <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">{currentHint.labs}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Your Diagnosis
          </label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter your diagnosis..."
            rows={3}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
          />
        </div>

        {submittedDiagnosis && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-400 font-medium">Diagnosis submitted!</p>
            <p className="text-green-600 dark:text-green-500">{submittedDiagnosis}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleSubmitDiagnosis}
            disabled={!diagnosis.trim() || submitting}
            className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Diagnosis"}
          </button>
          
          {currentHintIndex < hints.length - 1 && (
            <button
              onClick={handleNextHint}
              className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Next Hint →
            </button>
          )}
          
          {currentHintIndex > 0 && (
            <button
              onClick={handlePrevHint}
              className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              ← Previous
            </button>
          )}
        </div>

        {currentHintIndex === hints.length - 1 && submittedDiagnosis && (
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-700 dark:text-blue-400 font-medium">You've completed all hints!</p>
            <p className="text-blue-600 dark:text-blue-500">Your final diagnosis: {submittedDiagnosis}</p>
          </div>
        )}
      </main>
    </div>
  );
}
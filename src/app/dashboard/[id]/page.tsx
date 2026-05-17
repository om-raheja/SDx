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
  const [diagnoses, setDiagnoses] = useState<Record<number, string>>({});
  const [currentDiagnosis, setCurrentDiagnosis] = useState("");
  const [problemRep, setProblemRep] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (notFound) {
      router.push('/dashboard');
      return;
    }
  }, [notFound, router]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/cases/${id}`)
      .then(res => {
        if (res.status === 401) {
          router.push('/auth/signin');
          return null;
        }
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data?.case) {
          setCaseData(data.case);
          setHints(data.hints || []);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, router, notFound]);

  const currentHint = hints[currentHintIndex];
  const isProblemRepPhase = currentHintIndex === hints.length && !completed;
  const canAdvance = currentDiagnosis.trim().length > 0;
  const canSubmit = isProblemRepPhase && problemRep.trim().length > 0;

  const handleNextHint = () => {
    if (!canAdvance) return;
    setDiagnoses((prev) => ({ ...prev, [currentHintIndex + 1]: currentDiagnosis.trim() }));
    setCurrentHintIndex((prev) => prev + 1);
  };

  const handlePrevHint = () => {
    if (currentHintIndex > 0) {
      setDiagnoses((prev) => ({ ...prev, [currentHintIndex + 1]: currentDiagnosis.trim() }));
      const newIndex = currentHintIndex - 1;
      setCurrentHintIndex(newIndex);
      setCurrentDiagnosis(diagnoses[newIndex + 1] || currentDiagnosis);
    }
  };

  const handleSubmitAll = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError("");

    const entries = Object.entries(diagnoses)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => ({ hint: parseInt(k), diagnosis: v.trim() }));

    if (entries.length === 0) {
      setSubmitError("Submit at least one diagnosis");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/cases/${id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnoses: entries,
          problemRep: problemRep.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.details || data.error || "Failed to submit");
        return;
      }

      setCompleted(true);
    } catch (err) {
      setSubmitError("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || notFound) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!caseData) {
    return null;
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
        
        {!isProblemRepPhase && !completed && (
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
        )}

        {isProblemRepPhase && !completed && (
          <div className="mb-6">
            <span className="text-zinc-500 dark:text-zinc-400">Problem Representation</span>
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-2">
              <div className="h-2 bg-blue-600 dark:bg-blue-400 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        )}

        {!isProblemRepPhase && !completed && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Hint {currentHintIndex + 1}</h2>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{currentHint?.content}</p>
              {currentHint?.image_url && (
                <img src={`/api/image?url=${encodeURIComponent(currentHint.image_url)}`} alt="Case" className="mt-4 max-w-full rounded" />
              )}
              {currentHint?.labs && (
                <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">{currentHint.labs}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isProblemRepPhase && !completed && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Problem Representation</h2>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Synthesize your findings into a concise problem representation.
              </p>
            </div>
          </div>
        )}

        {!completed && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {isProblemRepPhase ? "Your Problem Representation" : `Your Diagnosis`}
            </label>
            <textarea
              value={isProblemRepPhase ? problemRep : currentDiagnosis}
              onChange={(e) => {
                if (isProblemRepPhase) setProblemRep(e.target.value);
                else setCurrentDiagnosis(e.target.value);
              }}
              placeholder={isProblemRepPhase ? "e.g., A 55-year-old man with acute chest pain..." : "Enter your diagnosis..."}
              rows={isProblemRepPhase ? 4 : 3}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
            />
          </div>
        )}

        {!completed && (
          <div className="flex gap-4 mb-8">
            {currentHintIndex > 0 && (
              <button
                onClick={handlePrevHint}
                className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ← Previous
              </button>
            )}
            {isProblemRepPhase ? (
              <button
                onClick={handleSubmitAll}
                disabled={!canSubmit || submitting}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Case"}
              </button>
            ) : (
              <button
                onClick={handleNextHint}
                disabled={!canAdvance}
                className="flex-1 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium disabled:opacity-50"
              >
                {currentHintIndex === hints.length - 1 ? "Continue to PR →" : "Next Hint →"}
              </button>
            )}
          </div>
        )}

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{submitError}</p>
          </div>
        )}

        {completed && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-2">Case Complete!</p>
            <p className="text-blue-600 dark:text-blue-500">Your diagnoses and problem representation have been submitted to your teacher.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

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

interface Diagnosis {
  hint: number;
  diagnosis: string;
}

export default function CaseDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [caseData, setCaseData] = useState<any>(null);
  const [hints, setHints] = useState<Hint[]>([]);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [currentDiagnosis, setCurrentDiagnosis] = useState("");
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (!id) return;
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
  const hasSubmittedForCurrentHint = diagnoses.some(d => d.hint === currentHintIndex + 1);

  const handleSubmitDiagnosis = async () => {
    if (!currentDiagnosis.trim()) return;
    setSubmitting(true);
    
    const newDiagnosis = { hint: currentHintIndex + 1, diagnosis: currentDiagnosis.trim() };
    const updatedDiagnoses = [...diagnoses, newDiagnosis];
    setDiagnoses(updatedDiagnoses);
    
    try {
      const isLastHint = currentHintIndex === hints.length - 1;
      const res = await fetch(`/api/cases/${id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: currentDiagnosis.trim(),
          submitted_after_hint: currentHintIndex + 1,
          is_final: isLastHint,
        }),
      });
      
      if (res.ok && isLastHint) {
        setCompleted(true);
      } else if (res.ok) {
        // Clear current diagnosis after submitting, move to next hint
        setCurrentDiagnosis("");
        if (currentHintIndex < hints.length - 1) {
          setCurrentHintIndex(currentHintIndex + 1);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleNextHint = () => {
    if (hasSubmittedForCurrentHint && currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
      // Check if we already have a diagnosis for this hint
      const existing = diagnoses.find(d => d.hint === currentHintIndex + 1);
      setCurrentDiagnosis(existing?.diagnosis || "");
    }
  };

  const handlePrevHint = () => {
    if (currentHintIndex > 0) {
      setCurrentHintIndex(currentHintIndex - 1);
      // Show existing diagnosis for this hint if any
      const existing = diagnoses.find(d => d.hint === currentHintIndex + 1);
      setCurrentDiagnosis(existing?.diagnosis || "");
    }
  };

  const goToHint = (hintNum: number) => {
    setCurrentHintIndex(hintNum - 1);
    const existing = diagnoses.find(d => d.hint === hintNum);
    setCurrentDiagnosis(existing?.diagnosis || "");
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
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Hint {currentHintIndex + 1}</h2>
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{currentHint?.content}</p>
            {currentHint?.image_url && (
              <img 
                src={`/api/image?url=${encodeURIComponent(currentHint.image_url)}`} 
                alt="Case" 
                className="mt-4 max-w-full rounded" 
              />
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
            Your Diagnosis for Hint {currentHintIndex + 1}
          </label>
          <textarea
            value={currentDiagnosis}
            onChange={(e) => setCurrentDiagnosis(e.target.value)}
            placeholder="Enter your diagnosis..."
            rows={3}
            disabled={hasSubmittedForCurrentHint}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg disabled:opacity-50 disabled:bg-zinc-100 disabled:dark:bg-zinc-800"
          />
        </div>

        {hasSubmittedForCurrentHint && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-400 font-medium">Diagnosis submitted for Hint {currentHintIndex + 1}</p>
          </div>
        )}

        {!hasSubmittedForCurrentHint && (
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleSubmitDiagnosis}
              disabled={!currentDiagnosis.trim() || submitting}
              className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Diagnosis"}
            </button>
          </div>
        )}

        {hasSubmittedForCurrentHint && currentHintIndex < hints.length - 1 && (
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleNextHint}
              className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium"
            >
              Next Hint →
            </button>
          </div>
        )}

        {currentHintIndex > 0 && (
          <button
            onClick={handlePrevHint}
            className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 mb-8"
          >
            ← Previous Hint
          </button>
        )}

        {diagnoses.length > 0 && (
          <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Your Diagnoses</h2>
            <div className="space-y-4">
              {diagnoses.map((d) => (
                <div 
                  key={d.hint} 
                  onClick={() => goToHint(d.hint)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    d.hint === currentHintIndex + 1
                      ? 'border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Hint {d.hint}</span>
                    {d.hint === hints.length && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-400 rounded">Final</span>
                    )}
                  </div>
                  <p className="text-zinc-900 dark:text-zinc-200">{d.diagnosis}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {completed && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-2">Case Complete!</p>
            <p className="text-blue-600 dark:text-blue-500">Your final diagnosis has been submitted to your teacher.</p>
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

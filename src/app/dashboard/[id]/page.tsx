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

  const handleDiagnosisChange = (hintNum: number, value: string) => {
    const newDiagnoses = [...diagnoses];
    const existing = newDiagnoses.findIndex(d => d.hint === hintNum);
    if (existing >= 0) {
      newDiagnoses[existing].diagnosis = value;
    } else {
      newDiagnoses.push({ hint: hintNum, diagnosis: value });
    }
    setDiagnoses(newDiagnoses);
  };

  const handleSubmitAll = async () => {
    if (diagnoses.length === 0) return;
    setSubmitting(true);
    
    try {
      const isFinal = diagnoses.length === hints.length;
      const res = await fetch(`/api/cases/${id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnoses: diagnoses.map(d => ({
            hint_number: d.hint,
            diagnosis: d.diagnosis
          })),
          is_final: isFinal,
        }),
      });
      
      if (res.ok) {
        setCompleted(true);
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
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
            {hints.length} Hints Available
          </span>
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-2">
            <div 
              className="h-2 bg-zinc-900 dark:bg-white rounded-full transition-all"
              style={{ width: `${(diagnoses.length / hints.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {hints.map((hint, index) => (
            <div key={hint.id} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-zinc-500">Hint {hint.hint_order}</span>
                {diagnoses.find(d => d.hint === hint.hint_order) && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-400 rounded">Saved</span>
                )}
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap mb-3">{hint.content}</p>
              {hint.image_url && (
                <img 
                  src={`/api/image?url=${encodeURIComponent(hint.image_url)}`} 
                  alt="Hint" 
                  className="mt-2 max-w-full rounded" 
                />
              )}
              {hint.labs && (
                <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">{hint.labs}</p>
                </div>
              )}
              <textarea
                value={diagnoses.find(d => d.hint === hint.hint_order)?.diagnosis || ''}
                onChange={(e) => handleDiagnosisChange(hint.hint_order, e.target.value)}
                placeholder={`Enter diagnosis for hint ${hint.hint_order}...`}
                rows={3}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg mt-3"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSubmitAll}
            disabled={diagnoses.length === 0 || submitting}
            className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium disabled:opacity-50"
          >
            {submitting ? "Submitting..." : `Submit All Diagnoses (${diagnoses.length}/${hints.length})`}
          </button>
        </div>

        {completed && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-2">Case Complete!</p>
            <p className="text-blue-600 dark:text-blue-500">Your diagnoses have been submitted to your teacher.</p>
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

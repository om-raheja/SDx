"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCase() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [hints, setHints] = useState<string[]>(Array(7).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleHintChange = (index: number, value: string) => {
    const newHints = [...hints];
    newHints[index] = value;
    setHints(newHints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!title.trim()) {
      setError("Please enter a case title");
      return;
    }
    
    const emptyHints = hints.filter(h => !h.trim());
    if (emptyHints.length > 0) {
      setError(`Please fill in all 7 hints (${emptyHints.length} empty)`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          hints: hints.map((content, idx) => ({
            hint_order: idx + 1,
            content: content.trim(),
          })),
        }),
      });
      
      if (res.ok) {
        router.push("/teacher");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create case");
      }
    } catch {
      setError("Failed to create case");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <button onClick={() => router.push("/teacher")} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Create Case</h1>
        <div className="w-20" />
      </header>
      
      <main className="max-w-2xl mx-auto py-8 px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Case Title (Diagnosis)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Pneumonia"
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">7 Progressive Hints</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Write hints that progressively reveal more information to help students diagnose the case.
            </p>
            
            {hints.map((hint, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Hint {idx + 1}
                </label>
                <textarea
                  value={hint}
                  onChange={(e) => handleHintChange(idx, e.target.value)}
                  placeholder={`Hint ${idx + 1} - what information is revealed at this stage?`}
                  rows={3}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Case"}
          </button>
        </form>
      </main>
    </div>
  );
}

"use client";

import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TEACHER_EMAIL = "soniasethi66@hotmail.com";

interface HintInput {
  content: string;
  image_url: string;
  labs: string;
}

export default function CreateCase() {
  const user = useUser({ or: 'return-null' });
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [hints, setHints] = useState<HintInput[]>(
    Array(7).fill({ content: "", image_url: "", labs: "" })
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.primaryEmail !== TEACHER_EMAIL) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const updateHint = (index: number, field: keyof HintInput, value: string) => {
    const newHints = [...hints];
    newHints[index] = { ...newHints[index], [field]: value };
    setHints(newHints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || hints.some(h => !h.content.trim())) {
      setError("Title and all 7 hints are required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, hints })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create case");
        return;
      }

      router.push("/teacher");
    } catch {
      setError("Failed to create case");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.primaryEmail !== TEACHER_EMAIL) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => router.push("/teacher")}
          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Create New Case
        </h1>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Case Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 45-year-old male with chest pain"
              className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          {hints.map((hint, i) => (
            <div
              key={i}
              className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <h3 className="font-medium mb-3 text-zinc-900 dark:text-zinc-50">
                Hint {i + 1}
              </h3>
              <div className="space-y-3">
                <textarea
                  value={hint.content}
                  onChange={(e) => updateHint(i, "content", e.target.value)}
                  placeholder="Hint content (required)"
                  rows={2}
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                />
                <input
                  type="text"
                  value={hint.image_url}
                  onChange={(e) => updateHint(i, "image_url", e.target.value)}
                  placeholder="Image URL (optional)"
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                />
                <textarea
                  value={hint.labs}
                  onChange={(e) => updateHint(i, "labs", e.target.value)}
                  placeholder="Labs (optional)"
                  rows={2}
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                />
              </div>
            </div>
          ))}

          {error && (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Case"}
          </button>
        </form>
      </main>
    </div>
  );
}
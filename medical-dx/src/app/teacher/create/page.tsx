"use client";

import { useUser, UserButton } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TEACHER_EMAIL = "soniasethi66@hotmail.com";

interface Hint {
  content: string;
  image_url: string;
  labs: string;
}

export default function CreateCase() {
  const user = useUser();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [hints, setHints] = useState<Hint[]>(Array(7).fill({ content: "", image_url: "", labs: "" }));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.primaryEmail !== TEACHER_EMAIL) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const updateHint = (i: number, f: keyof Hint, v: string) => {
    const newHints = [...hints];
    newHints[i] = { ...newHints[i], [f]: v };
    setHints(newHints);
  };

  const handleSubmit = async () => {
    if (!title.trim() || hints.some(h => !h.content.trim())) {
      alert("Title and all hints required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, hints })
      });
      if (res.ok) {
        router.push("/teacher");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200">
        <button onClick={() => router.push("/teacher")} className="text-zinc-600 hover:text-zinc-900">
          ← Back
        </button>
        <h1 className="ml-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Create Case</h1>
      </header>
      <main className="max-w-2xl mx-auto py-8 px-6 space-y-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Case title"
          className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
        />
        {hints.map((hint, i) => (
          <div key={i} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200">
            <h3 className="font-medium mb-2">Hint {i + 1}</h3>
            <textarea
              value={hint.content}
              onChange={e => updateHint(i, "content", e.target.value)}
              placeholder="Hint content"
              rows={2}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              value={hint.image_url}
              onChange={e => updateHint(i, "image_url", e.target.value)}
              placeholder="Image URL (optional)"
              className="w-full p-2 border rounded mb-2"
            />
            <textarea
              value={hint.labs}
              onChange={e => updateHint(i, "labs", e.target.value)}
              placeholder="Labs (optional)"
              rows={2}
              className="w-full p-2 border rounded"
            />
          </div>
        ))}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-zinc-900 text-white rounded-lg disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Case"}
        </button>
      </main>
    </div>
  );
}
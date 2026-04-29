"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Pencil } from "lucide-react";

interface HintData {
  content: string;
  imageUrl: string;
  labs: string;
}

export default function EditCaseHints() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [caseTitle, setCaseTitle] = useState("");
  const [hints, setHints] = useState<HintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingImageUrl, setEditingImageUrl] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!id) return;

    fetch(`/api/cases/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.case) {
          setError("Case not found");
          return;
        }

        setCaseTitle(data.case.title || "");
        const nextHints = (data.hints || []).map((h: any) => ({
          content: h.content || "",
          imageUrl: h.image_url || "",
          labs: h.labs || "",
        }));

        setHints(nextHints.length > 0 ? nextHints : [{ content: "", imageUrl: "", labs: "" }, { content: "", imageUrl: "", labs: "" }]);
      })
      .catch(() => setError("Failed to load case"))
      .finally(() => setLoading(false));
  }, [id]);

  const updateHint = (index: number, key: keyof HintData, value: string) => {
    setHints((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleSave = async () => {
    if (hints.length < 2) {
      setError("At least 2 hints are required");
      return;
    }

    setSaving(true);
    setError("");

    const payloadHints = hints.map((h, i) => ({
      hint_order: i + 1,
      content: h.content,
      imageUrl: h.imageUrl,
      labs: h.labs,
    }));

    try {
      const res = await fetch(`/api/cases/${id}/hints`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hints: payloadHints }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save hints");
      }
    } catch {
      setError("Failed to save hints");
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Edit Case Hints</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 dark:text-white rounded-lg"
        >
          Back
        </button>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-6 space-y-6">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Case</p>
          <p className="text-lg font-medium text-zinc-900 dark:text-white">{caseTitle}</p>
        </div>

        <div className="space-y-4">
          {hints.map((hint, index) => (
            <div key={index} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Hint {index + 1}</p>
              <textarea
                value={hint.content}
                onChange={(e) => updateHint(index, "content", e.target.value)}
                rows={3}
                placeholder="Hint content"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded mb-2"
              />
              {hint.imageUrl && !editingImageUrl[index] ? (
                <div className="relative mb-2">
                  <img
                    src={`/api/image?url=${encodeURIComponent(hint.imageUrl)}`}
                    alt={`Hint ${index + 1}`}
                    className="w-full max-h-56 object-contain rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                  <button
                    onClick={() => setEditingImageUrl((prev) => ({ ...prev, [index]: true }))}
                    className="absolute top-2 right-2 p-1.5 rounded bg-black/60 text-white hover:bg-black/70"
                    title="Edit image URL"
                    aria-label="Edit image URL"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={hint.imageUrl}
                  onChange={(e) => updateHint(index, "imageUrl", e.target.value)}
                  onBlur={() => setEditingImageUrl((prev) => ({ ...prev, [index]: false }))}
                  placeholder="Image URL (optional)"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded mb-2"
                />
              )}
              <textarea
                value={hint.labs}
                onChange={(e) => updateHint(index, "labs", e.target.value)}
                rows={2}
                placeholder="Labs (optional)"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Hint Changes"}
        </button>
      </main>
    </div>
  );
}

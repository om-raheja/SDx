"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

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
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<Record<number, boolean>>({});
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const setFileInputRef = (index: number, el: HTMLInputElement | null) => {
    fileInputRefs.current[index] = el;
  };

  const replaceHintImage = async (index: number, file: File) => {
    if (!file) return;
    setUploadingImage((prev) => ({ ...prev, [index]: true }));
    setError("");

    try {
      const oldUrl = hints[index]?.imageUrl;
      if (oldUrl) {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: oldUrl }),
        });
      }

      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        setError(data.details ? `${data.error || "Image upload failed"}: ${data.details}` : (data.error || "Image upload failed"));
        return;
      }

      const data = await uploadRes.json();
      updateHint(index, "imageUrl", data.url);
    } catch {
      setError("Image upload failed");
    } finally {
      setUploadingImage((prev) => ({ ...prev, [index]: false }));
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = "";
      }
    }
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

  const handleDelete = async () => {
    if (!confirm("Delete this case and all its submissions? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: "DELETE",
        headers: { 'x-delete-confirm': 'sdxlab-delete-2026' },
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete case");
      }
    } catch {
      setError("Failed to delete case");
    }
    setDeleting(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Edit Case Hints</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Case"}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 dark:text-white rounded-lg"
          >
            Back
          </button>
        </div>
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
              <input
                type="file"
                accept="image/*"
                ref={(el) => setFileInputRef(index, el)}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) replaceHintImage(index, file);
                }}
                className="hidden"
              />
              {hint.imageUrl ? (
                <div className="relative mb-2">
                  <img
                    src={`/api/image?url=${encodeURIComponent(hint.imageUrl)}`}
                    alt={`Hint ${index + 1}`}
                    className="w-full max-h-56 object-contain rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                  <button
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="absolute top-2 right-2 p-1.5 rounded bg-black/60 text-white hover:bg-black/70"
                    title="Replace image"
                    aria-label="Replace image"
                    disabled={uploadingImage[index]}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefs.current[index]?.click()}
                  className="mb-2 px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded border border-zinc-300 dark:border-zinc-700"
                  disabled={uploadingImage[index]}
                >
                  {uploadingImage[index] ? "Uploading..." : "Upload Image"}
                </button>
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

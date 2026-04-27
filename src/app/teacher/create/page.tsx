"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface HintData {
  content: string;
  imageUrl: string;
}

export default function CreateCase() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [hints, setHints] = useState<HintData[]>(
    Array(7).fill(null).map(() => ({ content: "", imageUrl: "" }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<{index: number}[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileInputRef = (index: number, el: HTMLInputElement | null) => {
    fileInputRefs.current[index] = el;
  };

  const handleContentChange = (index: number, value: string) => {
    const newHints = [...hints];
    newHints[index].content = value;
    setHints(newHints);
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!file) return;
    
    setUploading([...uploading, { index }]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        const newHints = [...hints];
        newHints[index].imageUrl = data.url;
        setHints(newHints);
      } else {
        setError('Failed to upload image');
      }
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(uploading.filter(u => u.index !== index));
    }
  };

  const handleRemoveImage = (index: number) => {
    const newHints = [...hints];
    newHints[index].imageUrl = "";
    setHints(newHints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!title.trim()) {
      setError("Please enter a case title");
      return;
    }
    
    const emptyHints = hints.filter(h => !h.content.trim());
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
          hints: hints.map((h, idx) => ({
            hint_order: idx + 1,
            content: h.content.trim(),
            image_url: h.imageUrl || null,
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

          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">7 Progressive Hints</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Add text or an image (or both) for each hint. At least one is required.
            </p>
            
            {hints.map((hint, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Hint {idx + 1}
                </label>
                
                <textarea
                  value={hint.content}
                  onChange={(e) => handleContentChange(idx, e.target.value)}
                  placeholder={`Text for hint ${idx + 1}...`}
                  rows={3}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg mb-3"
                />
                
                <div className="flex items-center gap-3">
                  <input
                    ref={(el) => handleFileInputRef(idx, el)}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(idx, file);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[idx]?.click()}
                    disabled={uploading.some(u => u.index === idx)}
                    className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {uploading.some(u => u.index === idx) ? "Uploading..." : "Add Image"}
                  </button>
                  
                  {hint.imageUrl && (
                    <div className="relative">
                      <img src={hint.imageUrl} alt={`Hint ${idx + 1}`} className="h-20 w-auto rounded border" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                
                {hint.imageUrl && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">Image attached</p>
                )}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || uploading.length > 0}
            className="w-full px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Case"}
          </button>
        </form>
      </main>
    </div>
  );
}
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface HintData {
  content: string;
  imageUrl: string;
}

export default function CreateCase() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [hintCount, setHintCount] = useState(7);
  const [hints, setHints] = useState<HintData[]>(
    Array(7).fill(null).map(() => ({ content: "", imageUrl: "" }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<{index: number}[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const newHints = Array(hintCount).fill(null).map((_, i) => ({
      content: hints[i]?.content || "",
      imageUrl: hints[i]?.imageUrl || "",
    }));
    setHints(newHints);
  }, [hintCount]);

  const handleHintCountChange = (value: number) => {
    const count = Math.max(2, Math.min(20, value));
    setHintCount(count);
  };

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
        setError('Upload failed');
      }
    } catch {
      setError('Upload failed');
    }
    setUploading(uploading.filter(u => u.index !== index));
  };

  const handleImageRemove = (index: number) => {
    const newHints = [...hints];
    newHints[index].imageUrl = "";
    setHints(newHints);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title required');
      return;
    }
    
    const validHints = hints.filter(h => h.content.trim() || h.imageUrl);
    if (validHints.length < 2) {
      setError('At least 2 hints with content required');
      return;
    }

    if (validHints.length !== hintCount) {
      setError(`Please fill in all ${hintCount} hints`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          hints: hints.map((h, i) => ({
            hint_order: i + 1,
            content: h.content,
            imageUrl: h.imageUrl,
          })),
        }),
      });

      if (res.ok) {
        router.push('/teacher');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create case');
      }
    } catch {
      setError('Failed to create case');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 header-accent">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Create Case</h1>
        <button onClick={() => router.push('/teacher')} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 dark:text-white rounded-lg">
          Back
        </button>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Case Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chest Pain Case"
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Number of Hint Bundles
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="2"
              max="20"
              value={hintCount}
              onChange={(e) => handleHintCountChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer"
            />
            <input
              type="number"
              min="2"
              max="20"
              value={hintCount}
              onChange={(e) => handleHintCountChange(parseInt(e.target.value) || 2)}
              className="w-16 px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg text-center"
            />
          </div>
          <p className="text-sm text-zinc-500 mt-1">Choose between 2-20 hint bundles</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white">Hints</h2>
          {hints.map((hint, index) => (
            <div key={index} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 card-accent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Hint {index + 1}</span>
                {hint.imageUrl && (
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove Image
                  </button>
                )}
              </div>
              <textarea
                value={hint.content}
                onChange={(e) => handleContentChange(index, e.target.value)}
                placeholder="Enter hint content..."
                rows={3}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg mb-2"
              />
              <input
                type="file"
                accept="image/*"
                ref={(el) => handleFileInputRef(index, el)}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(index, file);
                }}
                className="hidden"
              />
              {!hint.imageUrl && (
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[index]?.click()}
                  disabled={uploading.some(u => u.index === index)}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {uploading.some(u => u.index === index) ? "Uploading..." : "Add Image"}
                </button>
              )}
              {hint.imageUrl && (
                <img 
                  src={`/api/image?url=${encodeURIComponent(hint.imageUrl)}`} 
                  alt={`Hint ${index + 1}`} 
                  className="mt-2 max-h-40 rounded-lg" 
                />
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Case"}
        </button>
      </main>
    </div>
  );
}
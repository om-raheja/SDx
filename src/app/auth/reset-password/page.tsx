"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Invalid reset link");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/auth/signin"), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset password");
      }
    } catch { setError("Failed to reset password"); }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 min-h-screen">
        <main className="flex flex-col items-center gap-6 py-12 px-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-green-600">Password Reset</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Your password has been reset. Redirecting to sign in...</p>
        </main>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 min-h-screen">
        <main className="flex flex-col items-center gap-6 py-12 px-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Link</h1>
          <p className="text-zinc-600 dark:text-zinc-400">This password reset link is invalid or has expired.</p>
          <button onClick={() => router.push("/auth/signin")} className="text-blue-600 hover:underline">
            Back to sign in
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <main className="flex flex-col items-center gap-6 py-12 px-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Reset Password</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Enter your new password.</p>
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex flex-col flex-1 items-center justify-center min-h-screen"><p>Loading...</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

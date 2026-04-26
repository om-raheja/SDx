"use client";

import { useState, useEffect } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [authRequestId, setAuthRequestId] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleSSO = () => {
    window.location.href = "/api/auth/signin";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuthRequestId(data.auth_request_id);
        setSent(true);
      }
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/magic-link/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, auth_request_id: authRequestId }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error(err);
    }
    setVerifying(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 min-h-screen transition-colors">
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
      >
        {darkMode ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <main className="flex flex-col items-center gap-8 py-16 px-8 max-w-lg w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
            SDx Lab
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Interactive Medical Education Platform
          </p>
        </div>

        <p className="text-center text-zinc-600 dark:text-zinc-500 max-w-md">
          Practice diagnostic reasoning through step-by-step clinical cases. 
          Submit your diagnosis at each stage and learn from progressive hints.
        </p>

        {!sent ? (
          <>
            <button
              onClick={handleSSO}
              className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg w-full max-w-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              Continue with Google
            </button>

            <div className="flex items-center gap-4 w-full max-w-sm">
              <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
              <span className="text-sm text-zinc-500 dark:text-zinc-500">or</span>
              <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
            </div>

            <form onSubmit={handleSend} className="flex flex-col gap-4 w-full max-w-sm">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg disabled:opacity-50 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {sending ? "Sending..." : "Email Magic Link"}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-4 w-full max-w-sm">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
              Enter the verification code from your email
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg text-center text-lg tracking-widest"
              maxLength={6}
              required
            />
            <button
              type="submit"
              disabled={verifying}
              className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Verify Code"}
            </button>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              Use different email
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
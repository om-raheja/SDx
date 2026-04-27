"use client";

import { useState, useEffect, useRef } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [authRequestId, setAuthRequestId] = useState("");
  const [storedEmail, setStoredEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | undefined)[]>([]);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark");
  };

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
        setStoredEmail(email);
        setSent(true);
      }
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      if (newCode.every(d => d) && newCode.join("").length === 6) {
        handleVerify(newCode.join(""));
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, "");
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(d => d) && index === 5) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (pasted.length > 0) {
      const newCode = [...code];
      pasted.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit;
      });
      setCode(newCode);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      if (newCode.every(d => d) && newCode.join("").length === 6) {
        handleVerify(newCode.join(""));
      }
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || code.join("");
    if (!finalCode || finalCode.length !== 6) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/magic-link/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: finalCode, auth_request_id: authRequestId, email: storedEmail }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error(err);
    }
    setVerifying(false);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 min-h-screen transition-colors">
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
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
              className="flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg w-full max-w-sm font-medium text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
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
          <div className="flex flex-col gap-4 w-full max-w-sm items-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
              Enter the verification code from your email
            </p>
            <div className="flex gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el ?? undefined; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
                  maxLength={6}
                />
              ))}
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={verifying || code.some(d => !d)}
              className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg disabled:opacity-50 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              {verifying ? "Verifying..." : "Verify Code"}
            </button>
            <button
              onClick={() => {
                setSent(false);
                setCode(["", "", "", "", "", ""]);
              }}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              Use different email
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
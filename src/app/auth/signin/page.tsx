"use client";

import { useState, useEffect } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark");
  };

  const handleSSO = (provider: string) => {
    window.location.href = `/api/auth/signin?provider=${provider}`;
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        alert("Check your email for the magic link!");
      } else {
        setError("Failed to send magic link");
      }
    } catch { setError("Failed to send magic link"); }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Enter your email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResetSent(true);
      } else {
        setError("Failed to send reset email");
      }
    } catch { setError("Failed to send reset email"); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "signin" ? "/api/auth/login" : "/api/auth/signup";
      const body = mode === "signin" 
        ? { email, password }
        : { email, password, firstName, lastName };
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch { setError("Authentication failed"); }
    setLoading(false);
  };

  if (showReset && resetSent) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 min-h-screen">
        <button onClick={toggleDarkMode} className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800">🌙</button>
        <main className="flex flex-col items-center gap-6 py-12 px-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-green-600">Check your email</h1>
          <p className="text-zinc-600 dark:text-zinc-400">We sent a password reset link to your email.</p>
          <button onClick={() => { setShowReset(false); setResetSent(false); }} className="text-blue-600 hover:underline">
            Back to sign in
          </button>
        </main>
      </div>
    );
  }

  if (showReset) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 min-h-screen">
        <button onClick={toggleDarkMode} className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800">🌙</button>
        <main className="flex flex-col items-center gap-6 py-12 px-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Reset Password</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Enter your email to receive a reset link.</p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleResetPassword} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
          <button onClick={() => setShowReset(false)} className="text-zinc-500 hover:text-zinc-700">Back to sign in</button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 min-h-screen transition-colors">
      <button onClick={toggleDarkMode} className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-lg">🌙</button>

      <main className="flex flex-col items-center gap-6 py-12 px-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">SDx Lab</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Interactive Medical Education</p>
        </div>

        <div className="w-full space-y-3">
          <button onClick={() => handleSSO('GoogleOAuth')} className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button onClick={() => handleSSO('MicrosoftOAuth')} className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <svg className="w-5 h-5" viewBox="0 0 23 23">
              <path fill="#F25022" d="M1 1h10v10H1z"/>
              <path fill="#7FBA00" d="M12 1h10v10H12z"/>
              <path fill="#00A4EF" d="M1 12h10v10H1z"/>
              <path fill="#FFB900" d="M12 12h10v10H12z"/>
            </svg>
            Continue with Microsoft
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
            <span className="text-xs text-zinc-500">or</span>
            <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
              required
            />
            {mode === "signup" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
                />
              </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="text-center flex flex-col gap-2">
            <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400">
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
            
            {mode === "signin" && (
              <button type="button" onClick={() => setShowReset(true)} className="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </button>
            )}
            
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
              <span className="text-xs text-zinc-500">or</span>
              <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
            </div>

            <button 
              type="button"
              onClick={handleMagicLink}
              disabled={!email || loading}
              className="text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400 disabled:opacity-50"
            >
              Send magic link instead
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
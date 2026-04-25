"use client";

export default function SignInPage() {
  const handleSignIn = () => {
    window.location.href = "/api/auth/signin";
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 min-h-screen">
      <main className="flex flex-col items-center gap-8 py-16 px-8 max-w-lg w-full">
        <h1 className="text-4xl font-semibold text-center text-zinc-900">
          Medical Diagnosis Practice
        </h1>
        <p className="text-lg text-center text-zinc-600">
          Sign in to continue
        </p>
        <button
          onClick={handleSignIn}
          className="px-6 py-3 bg-zinc-900 text-white rounded-lg"
        >
          Sign in with SSO
        </button>
      </main>
    </div>
  );
}
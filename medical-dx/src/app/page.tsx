"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-col items-center gap-8 py-16 px-8 max-w-lg w-full">
        <h1 className="text-4xl font-semibold text-center text-zinc-900 dark:text-zinc-50">
          Medical Diagnosis Practice
        </h1>
        <p className="text-lg text-center text-zinc-600 dark:text-zinc-400">
          Practice diagnostic reasoning through step-by-step case hints
        </p>
        <button 
          onClick={() => document.cookie = "user=1;path=/"; window.location.href = "/dashboard"}
          className="px-6 py-3 bg-zinc-900 text-white rounded-lg"
        >
          Sign In (Demo)
        </button>
      </main>
    </div>
  );
}
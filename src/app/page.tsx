"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for session cookie
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (cookies['scalekit_user']) {
      router.replace("/dashboard");
    } else {
      router.replace("/auth/signin");
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return null;
}
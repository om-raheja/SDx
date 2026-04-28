"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => {
        if (res.ok) {
          router.replace("/dashboard");
        } else {
          router.replace("/auth/signin");
        }
      })
      .catch(() => {
        router.replace("/auth/signin");
      })
      .finally(() => setLoading(false));
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
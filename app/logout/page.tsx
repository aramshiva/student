"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearStoredCredentials } from "@/lib/clientApi";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    clearStoredCredentials();

    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center">
      <p className="text-zinc-600 dark:text-zinc-400">Logging out...</p>
    </div>
  );
}

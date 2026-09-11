"use client";

import { useEffect } from "react";
import { clearAllStoredData } from "@/lib/clientApi";

export default function LogoutPage() {
  useEffect(() => {
    clearAllStoredData().finally(() => window.location.replace("/login"));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center">
      <p className="text-zinc-600 dark:text-zinc-400">Logging out...</p>
    </div>
  );
}

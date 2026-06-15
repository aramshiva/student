"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const iconVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1 },
};
import Link from "next/link";

const API_ENDPOINTS = [
  "/api/synergy/gradebook",
  "/api/synergy/student",
  "/api/synergy/schedule",
  "/api/synergy/attendance",
  "/api/synergy/calendar",
  "/api/synergy/messages",
  "/api/synergy/mail",
  "/api/synergy/history",
  "/api/synergy/tests",
  "/api/synergy/documents",
  "/api/synergy/reportcard",
  "/api/synergy/school/info",
  "/api/weather",
];

export default function DebugPage() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  }, []);

  const fetchAndCopyEndpoint = useCallback(
    async (endpoint: string) => {
      const credsRaw = localStorage.getItem("Student.creds");
      if (!credsRaw) {
        await copyToClipboard("No credentials found", `api-${endpoint}`);
        return;
      }

      setCopiedItem(`loading-${endpoint}`);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: credsRaw,
        });
        const data = await res.json();
        await copyToClipboard(JSON.stringify(data, null, 2), `api-${endpoint}`);
      } catch (err) {
        await copyToClipboard(
          `Error fetching ${endpoint}: ${err}`,
          `api-${endpoint}`,
        );
      }
    },
    [copyToClipboard],
  );

  return (
    <div className="p-8 space-y-6 min-h-screen dark:bg-zinc-900">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <p className="text-xl font-medium pb-3">API Debug</p>
        <p className="text-sm text-zinc-500">
          Fetch and copy raw API response data for debugging.
        </p>
      </div>

      <section className="space-y-4">
        <div className="grid gap-2 max-w-2xl">
          {API_ENDPOINTS.map((endpoint) => (
            <div
              key={endpoint}
              className="flex items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded border"
            >
              <p className="text-sm truncate font-mono">{endpoint}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAndCopyEndpoint(endpoint)}
                disabled={copiedItem === `loading-${endpoint}`}
                className="shrink-0 min-w-[100px]"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copiedItem === `loading-${endpoint}` ? (
                    <motion.span key="loading" variants={iconVariants} initial="hidden" animate="visible" exit="hidden" className="text-xs">
                      Loading...
                    </motion.span>
                  ) : copiedItem === `api-${endpoint}` ? (
                    <motion.span key="check" variants={iconVariants} initial="hidden" animate="visible" exit="hidden" className="flex items-center gap-1">
                      <Check className="h-4 w-4" /> Copied
                    </motion.span>
                  ) : (
                    <motion.span key="copy" variants={iconVariants} initial="hidden" animate="visible" exit="hidden" className="flex items-center gap-1">
                      <Copy className="h-4 w-4" /> Copy
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

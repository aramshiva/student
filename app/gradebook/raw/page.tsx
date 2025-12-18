"use client";

import * as React from "react";

export default function GradebookApiTestPage() {
  const [data, setData] = React.useState<unknown | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const credsRaw = localStorage.getItem("Student.creds");
        if (!credsRaw) {
          setError("No credentials found in localStorage (Student.creds)");
          setLoading(false);
          return;
        }
        const creds = JSON.parse(credsRaw || "{}");
        const res = await fetch("/api/synergy/gradebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error || `HTTP ${res.status}`);
        } else {
          setData(json);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Raw Gradebook Data</h1>
      <p className="text-yellow-500">This is a dev mode page.</p>
      <p className="text-red-500">
        Do not share the data on this page to users you do not trust! It
        contains your entire gradebook data.
      </p>
      {loading && <div>Loading gradebook...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-zinc-900 p-4 rounded border">
          {data ? JSON.stringify(data, null, 2) : "No data returned"}
        </pre>
      )}
    </div>
  );
}

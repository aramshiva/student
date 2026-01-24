"use client";

import { useState } from "react";
import Login from "@/components/Login";
import { LoginCredentials } from "@/types/gradebook";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/synergy/gradebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      let responseBody: any;
      if (!response.ok) {
        let serverMessage: string | null = null;
        try {
          const text = await response.text();

          if (response.status === 403 && text.includes("Access denied")) {
            serverMessage =
              "Forbidden: Your StudentVUE access has been denied by Synergy (HTTP error 403)";
          } else {
            try {
              responseBody = JSON.parse(text);
              if (
                responseBody &&
                typeof responseBody === "object" &&
                typeof responseBody.error === "string"
              ) {
                serverMessage = responseBody.error;
              }
            } catch {}
          }
        } catch {}
        throw new Error(
          serverMessage || `HTTP error! status: ${response.status}`,
        );
      }

      const raw = responseBody || (await response.json());
      const gradebookRoot = raw?.Gradebook ?? raw;
      const errorMessage =
        gradebookRoot?.["@ErrorMessage"] || gradebookRoot?._ErrorMessage;
      if (errorMessage) {
        throw new Error(String(errorMessage));
      }
      localStorage.setItem("Student.creds", JSON.stringify(credentials));
      const selectedDistrictZip = (credentials as any).zipcode || "98028";
      localStorage.setItem("Student.zip", selectedDistrictZip);
      // saves creds in LOCAL STORAGE (not cloud)
      // redirects to student page
      window.location.href = "/student";
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-9 dark:bg-zinc-900 bg-white">
      <Login onLogin={handleLogin} isLoading={isLoading} error={error} />
    </div>
  );
}

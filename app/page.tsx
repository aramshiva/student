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
      if (!response.ok) {
        let serverMessage: string | null = null;
        try {
          const maybeJson = await response.json();
          if (
            maybeJson &&
            typeof maybeJson === "object" &&
            typeof maybeJson.error === "string"
          ) {
            serverMessage = maybeJson.error;
          }
        } catch {
        }
        throw new Error(serverMessage || `HTTP error! status: ${response.status}`);
      }
      const raw = await response.json();
      const gradebookRoot = raw?.Gradebook ?? raw;
      const errorMessage =
        gradebookRoot?.["@ErrorMessage"] || gradebookRoot?._ErrorMessage;
      if (errorMessage) {
        throw new Error(String(errorMessage));
      }
      localStorage.setItem("studentvue-creds", JSON.stringify(credentials));
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

  return <Login onLogin={handleLogin} isLoading={isLoading} error={error} />;
}

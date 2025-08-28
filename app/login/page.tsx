"use client";

import { useState } from 'react';
import Login from '@/components/login';
import { useRouter } from 'next/navigation';
import { GradebookData, LoginCredentials } from '@/types/gradebook';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://${process.env.NEXT_PUBLIC_APIVUE_SERVER_URL}/gradebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: GradebookData = await response.json();
      if (data.data.Gradebook["@ErrorMessage"]) {
        throw new Error(data.data.Gradebook["@ErrorMessage"]);
      }
  localStorage.setItem('gradebookData', JSON.stringify(data));
      router.push('/gradebook');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gradebook data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Login
      onLogin={handleLogin}
      isLoading={isLoading}
      error={error}
    />
  );
}

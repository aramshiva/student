'use client';


import { useState } from 'react';
import Login from '@/components/Login';
import { LoginCredentials } from '@/types/gradebook';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://${process.env.NEXT_PUBLIC_APIVUE_SERVER_URL}/gradebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.data.Gradebook["@ErrorMessage"]) {
        throw new Error(data.data.Gradebook["@ErrorMessage"]);
      }
      localStorage.setItem('studentvue-creds', JSON.stringify(credentials));
      // saves creds in LOCAL STORAGE (not cloud)
      // redirects to student page
      window.location.href = '/student';
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Login failed');
      } else {
        setError('Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return <Login onLogin={handleLogin} isLoading={isLoading} error={error} />;
}

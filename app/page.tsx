'use client';

import { useState } from 'react';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';
import CourseDetail from '@/components/CourseDetail';
import Loading from '@/components/Loading';
import { GradebookData, LoginCredentials, Course } from '@/types/gradebook';

type AppState = 'login' | 'dashboard' | 'course-detail';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('login');
  const [gradebookData, setGradebookData] = useState<GradebookData | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      setGradebookData(data);
      setAppState('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gradebook data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setAppState('course-detail');
  };

  const handleBackToDashboard = () => {
    setSelectedCourse(null);
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setGradebookData(null);
    setSelectedCourse(null);
    setAppState('login');
    setError(null);
  };

  if (appState === 'login') {
    return (
      <Login
        onLogin={handleLogin}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (appState === 'dashboard' && gradebookData) {
    return (
      <Dashboard
        gradebookData={gradebookData}
        onCourseSelect={handleCourseSelect}
        onLogout={handleLogout}
      />
    );
  }

  if (appState === 'course-detail' && selectedCourse) {
    return (
      <CourseDetail
        course={selectedCourse}
        onBack={handleBackToDashboard}
      />
    );
  }

  // Loading state or error fallback
  return <Loading />;
}

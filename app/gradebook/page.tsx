"use client";

import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';
import CourseDetail from '@/components/CourseDetail';
import Loading from '@/components/loading';
import { useRouter } from 'next/navigation';
import { GradebookData, Course } from '@/types/gradebook';

export default function DashboardPage() {
  const [gradebookData, setGradebookData] = useState<GradebookData | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [appState, setAppState] = useState<'dashboard' | 'course-detail'>('dashboard');
  const router = useRouter();

  useEffect(() => {
  const stored = localStorage.getItem('gradebookData');
    if (stored) {
      setGradebookData(JSON.parse(stored));
    } else {
      router.replace('/login');
    }
  }, [router]);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setAppState('course-detail');
  };

  const handleBackToDashboard = () => {
    setSelectedCourse(null);
    setAppState('dashboard');
  };

  const handleLogout = () => {
  localStorage.removeItem('gradebookData');
    setGradebookData(null);
    setSelectedCourse(null);
    router.replace('/login');
  };

  if (!gradebookData) return <Loading />;

  if (appState === 'dashboard') {
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

  return <Loading />;
}

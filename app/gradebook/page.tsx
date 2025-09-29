"use client";

import { useEffect, useState } from "react";
import Dashboard from "@/components/Dashboard";
import CourseDetail from "@/components/CourseDetail";
import Loading from "@/components/loadingfunc";
import { GradebookData, Course } from "@/types/gradebook";

export default function GradebookPage() {
  const [gradebookData, setGradebookData] = useState<GradebookData | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds = localStorage.getItem("studentvue-creds");
    if (!creds) {
      window.location.href = "/";
      return;
    }
    const credentials = JSON.parse(creds);
  fetch('/api/synergy/gradebook', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data["@ErrorMessage"]) {
          throw new Error(data["@ErrorMessage"]);
        }
          setGradebookData({ data });
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Loading />;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!gradebookData) return null;

  if (selectedCourse) {
    return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }
  return (
    <Dashboard gradebookData={gradebookData} onCourseSelect={setSelectedCourse} onLogout={() => {
      localStorage.removeItem("studentvue-creds");
      window.location.href = "/";
    }} />
  );
}

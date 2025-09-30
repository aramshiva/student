"use client";

import { useEffect, useState, useCallback } from "react";
import Dashboard from "@/components/Dashboard";
import CourseDetail from "@/components/CourseDetail";
import Loading from "@/components/loadingfunc";
import { GradebookData, Course } from "@/types/gradebook";

export default function GradebookPage() {
  const [gradebookData, setGradebookData] = useState<GradebookData | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportingPeriods, setReportingPeriods] = useState<{
    index: number;
    label: string;
    start: string;
    end: string;
  }[]>([]);
  const [selectedReportingPeriod, setSelectedReportingPeriod] = useState<number | null>(null);
  const REPORTING_PERIOD_STORAGE_KEY = "studentvue-last-reporting-period";

  const fetchGradebook = useCallback(async (reportPeriodIndex: number | null = null) => {
    const creds = localStorage.getItem("studentvue-creds");
    if (!creds) {
      window.location.href = "/";
      return;
    }
    const credentials = JSON.parse(creds);
    setIsLoading(true);
    setError(null);
    try {
      const body = reportPeriodIndex != null
        ? { ...credentials, reportPeriod: reportPeriodIndex }
        : credentials;
      const res = await fetch('/api/synergy/gradebook', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data["@ErrorMessage"]) {
        throw new Error(data["@ErrorMessage"]);
      }
      const periodArrayRaw = data?.ReportingPeriods?.ReportPeriod;
      type RawRP = { _Index?: string; _GradePeriod?: string; _StartDate?: string; _EndDate?: string };
      const periodsRaw: RawRP[] = periodArrayRaw
        ? (Array.isArray(periodArrayRaw) ? periodArrayRaw : [periodArrayRaw])
        : [];
      const mapped = periodsRaw.map((p) => ({
        index: Number(p?._Index || 0),
        label: p?._GradePeriod || `Period ${p?._Index}`,
        start: p?._StartDate || '',
        end: p?._EndDate || '',
      }));
      setReportingPeriods(mapped);
      const currentIndex = reportPeriodIndex != null
        ? reportPeriodIndex
        : (data?.ReportingPeriod?._Index != null ? Number(data.ReportingPeriod._Index) : (mapped[0]?.index ?? 0));
      setSelectedReportingPeriod(currentIndex);
      try {
        localStorage.setItem(
          REPORTING_PERIOD_STORAGE_KEY,
          String(currentIndex)
        );
      } catch {}
      setGradebookData({ data });
      setSelectedCourse(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let stored: number | null = null;
    try {
      const raw = localStorage.getItem(REPORTING_PERIOD_STORAGE_KEY);
      if (raw != null && raw !== "") {
        const parsed = Number(raw);
        if (!isNaN(parsed)) stored = parsed;
      }
    } catch {}
    fetchGradebook(stored);
  }, [fetchGradebook]);

  if (isLoading) return <Loading />;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!gradebookData) return null;

  if (selectedCourse) {
    return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }
  return (
    <Dashboard
      gradebookData={gradebookData}
      onCourseSelect={setSelectedCourse}
      onLogout={() => {
        localStorage.removeItem("studentvue-creds");
        window.location.href = "/";
      }}
      reportingPeriods={reportingPeriods}
      selectedReportingPeriod={selectedReportingPeriod}
  onSelectReportingPeriod={(idx: number) => fetchGradebook(idx)}
      isLoading={isLoading}
    />
  );
}

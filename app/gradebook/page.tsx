"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import CourseDetail from "@/components/CourseDetail";
import { GradebookData, Course, Mark, Assignment } from "@/types/gradebook";
import {
  loadCustomGPAScale,
  numericToLetterGrade,
  loadCalculateGradesEnabled,
} from "@/utils/gradebook";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useTheme } from "next-themes";

function GradebookPageContent() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gradebookData, setGradebookData] = useState<GradebookData | null>(
    null,
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportingPeriods, setReportingPeriods] = useState<
    {
      index: number;
      label: string;
      start: string;
      end: string;
    }[]
  >([]);
  const [selectedReportingPeriod, setSelectedReportingPeriod] = useState<
    number | null
  >(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const REPORTING_PERIOD_STORAGE_KEY = "Student.lastReportingPeriod";
  const QUICK_STATS_STORAGE_KEY = "Student.quickStats";

  const initialCourseId = searchParams.get('course');
  const initialSticky = searchParams.get('sticky') === '1';
  const initialHypothetical = searchParams.get('hypothetical') === '1';

  const updateURL = useCallback((params: {
    courseId?: string | null;
    sticky?: boolean;
    hypothetical?: boolean;
  }) => {
    const current = new URLSearchParams(searchParams.toString());
    
    if (params.courseId) {
      current.set('course', params.courseId);
    } else if (params.courseId === null) {
      current.delete('course');
    }
    
    if (params.sticky !== undefined) {
      if (params.sticky) {
        current.set('sticky', '1');
      } else {
        current.delete('sticky');
      }
    }
    
    if (params.hypothetical !== undefined) {
      if (params.hypothetical) {
        current.set('hypothetical', '1');
      } else {
        current.delete('hypothetical');
      }
    }
    
    const queryString = current.toString();
    const newURL = queryString ? `/gradebook?${queryString}` : '/gradebook';
    router.push(newURL, { scroll: false });
  }, [searchParams, router]);

  function getCurrentMark(m: Mark | Mark[] | undefined): Mark | null {
    if (!m) return null;
    if (Array.isArray(m)) return m[m.length - 1] || null;
    return m;
  }

  interface GradebookLike {
    Gradebook?: {
      Courses?: { Course?: Course[] };
      [k: string]: unknown;
    };
    Courses?: { Course?: Course[] };
    [k: string]: unknown;
  }

  const computeAndStoreQuickStats = useCallback((root: GradebookLike) => {
    try {
      const gbRoot: GradebookLike = root?.Gradebook
        ? (root as GradebookLike).Gradebook!
        : root || {}; // tf is this
      const courses: Course[] = (gbRoot?.Courses?.Course as Course[]) || [];
      const gpaScale = loadCustomGPAScale();
      const calcFlag = loadCalculateGradesEnabled();
      let gradedCourses = 0;
      let totalGPAPoints = 0;
      let missingCount = 0;

      for (const course of courses) {
        const currentMark = getCurrentMark(course?.Marks?.Mark);
        if (!currentMark) continue;
        const portalRaw = Number(currentMark?._CalculatedScoreRaw) || 0;
        let effectivePct = portalRaw;
        if (calcFlag) {
          const assignments: Assignment[] =
            currentMark?.Assignments?.Assignment || [];
          let earned = 0;
          let possible = 0;
          assignments.forEach((a) => {
            const s = a._Score ? parseFloat(a._Score) : NaN;
            const m = a._ScoreMaxValue
              ? parseFloat(a._ScoreMaxValue)
              : a._PointPossible
                ? parseFloat(a._PointPossible)
                : NaN;
            if (Number.isFinite(s) && Number.isFinite(m) && m > 0) {
              earned += s;
              possible += m;
            }
          });
          if (possible > 0) effectivePct = (earned / possible) * 100;
        }
        if (effectivePct > 0) {
          gradedCourses++;
          const letter = numericToLetterGrade(effectivePct);
          totalGPAPoints += gpaScale[letter] ?? 0;
        }
        const assignments: Assignment[] =
          currentMark?.Assignments?.Assignment || [];
        for (const a of assignments) {
          const note = (a._Notes || "").trim().toLowerCase();
          if (note === "missing") missingCount++;
        }
      }

      const overallGPA =
        gradedCourses > 0
          ? (totalGPAPoints / gradedCourses).toFixed(2)
          : "0.00";
      const payload = {
        gpa: overallGPA,
        missing: missingCount,
        gradedCourses,
        totalCourses: courses.length,
        ts: Date.now(),
      };
      localStorage.setItem(QUICK_STATS_STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, []);

  const inFlightRef = useRef(false);

  const fetchGradebook = useCallback(
    async (reportPeriodIndex: number | null = null) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      const creds = localStorage.getItem("Student.creds");
      if (!creds) {
        window.location.href = "/";
        return;
      }
      const credentials = JSON.parse(creds);
      setIsLoading(true);
      setError(null);
      try {
        const body =
          reportPeriodIndex != null
            ? { ...credentials, reportPeriod: reportPeriodIndex }
            : credentials;
        const res = await fetch("/api/synergy/gradebook", {
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
        type RawRP = {
          _Index?: string;
          _GradePeriod?: string;
          _StartDate?: string;
          _EndDate?: string;
        };
        const periodsRaw: RawRP[] = periodArrayRaw
          ? Array.isArray(periodArrayRaw)
            ? periodArrayRaw
            : [periodArrayRaw]
          : [];
        const mapped = periodsRaw.map((p) => ({
          index: Number(p?._Index || 0),
          label: p?._GradePeriod || `Period ${p?._Index}`,
          start: p?._StartDate || "",
          end: p?._EndDate || "",
        }));
        setReportingPeriods(mapped);
        const currentIndex =
          reportPeriodIndex != null
            ? reportPeriodIndex
            : data?.ReportingPeriod?._Index != null
              ? Number(data.ReportingPeriod._Index)
              : (mapped[0]?.index ?? 0);
        setSelectedReportingPeriod(currentIndex);
        try {
          localStorage.setItem(
            REPORTING_PERIOD_STORAGE_KEY,
            String(currentIndex),
          );
        } catch {}
        setGradebookData({ data });
        computeAndStoreQuickStats(data);
        setSelectedCourse(null);
        setLastRefreshed(new Date());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
        inFlightRef.current = false;
      }
    },
    [computeAndStoreQuickStats],
  );

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

  useEffect(() => {
    if (!gradebookData || !initialCourseId) return;
    
    const gbRoot = gradebookData.data?.Gradebook || gradebookData.data || {};
    const courses: Course[] = (gbRoot?.Courses?.Course as Course[]) || [];
    const course = courses.find(c => c?._CourseID === initialCourseId);
    
    if (course && !selectedCourse) {
      setSelectedCourse(course);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradebookData, initialCourseId]);

  const handleCourseSelect = useCallback((course: Course) => {
    setSelectedCourse(course);
    updateURL({ courseId: course._CourseID });
  }, [updateURL]);

  const handleBack = useCallback(() => {
    setSelectedCourse(null);
    updateURL({ courseId: null, sticky: false, hypothetical: false });
  }, [updateURL]);

  const handleStateChange = useCallback((sticky: boolean, hypothetical: boolean) => {
    const currentSticky = searchParams.get('sticky') === '1';
    const currentHypothetical = searchParams.get('hypothetical') === '1';
    
    if (sticky !== currentSticky || hypothetical !== currentHypothetical) {
      updateURL({ sticky, hypothetical });
    }
  }, [searchParams, updateURL]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 p-9">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 py-6">
          <div className="flex-1 space-y-3">
            <Skeleton
              {...(theme === "dark"
                ? { baseColor: "#202020", highlightColor: "#444" }
                : {})}
              height={24}
              width={160}
            />
            <div className="flex items-center gap-3">
              <Skeleton
                {...(theme === "dark"
                  ? { baseColor: "#202020", highlightColor: "#444" }
                  : {})}
                height={20}
                width={110}
              />
              <Skeleton
                {...(theme === "dark"
                  ? { baseColor: "#202020", highlightColor: "#444" }
                  : {})}
                height={36}
                width={260}
              />
            </div>
          </div>
          <div className="flex items-center space-x-10 md:self-start">
            <div className="text-right space-y-2">
              <Skeleton
                {...(theme === "dark"
                  ? { baseColor: "#202020", highlightColor: "#444" }
                  : {})}
                height={16}
                width={34}
                className="ml-auto"
              />
              <Skeleton
                {...(theme === "dark"
                  ? { baseColor: "#202020", highlightColor: "#444" }
                  : {})}
                height={28}
                width={70}
              />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-900 divide-y divide-gray-200 dark:divide-gray-900">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-row space-x-6 items-center">
                  <Skeleton
                    {...(theme === "dark"
                      ? { baseColor: "#202020", highlightColor: "#444" }
                      : {})}
                    height={20}
                    width={180}
                  />
                  <Skeleton
                    {...(theme === "dark"
                      ? { baseColor: "#202020", highlightColor: "#444" }
                      : {})}
                    height={16}
                    width={220}
                  />
                </div>
                <Skeleton
                  {...(theme === "dark"
                    ? { baseColor: "#202020", highlightColor: "#444" }
                    : {})}
                  height={20}
                  width={56}
                />
              </div>
              <div className="ml-4 pt-1 space-y-2">
                <Skeleton
                  {...(theme === "dark"
                    ? { baseColor: "#202020", highlightColor: "#444" }
                    : {})}
                  height={32}
                  width={90}
                />
                <Skeleton
                  {...(theme === "dark"
                    ? { baseColor: "#202020", highlightColor: "#444" }
                    : {})}
                  height={16}
                  width={80}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!gradebookData) return null;

  if (selectedCourse) {
    return (
      <CourseDetail
        course={selectedCourse}
        onBack={handleBack}
        initialSticky={initialSticky}
        initialHypothetical={initialHypothetical}
        onStateChange={handleStateChange}
      />
    );
  }
  return (
    <Dashboard
      gradebookData={gradebookData}
      onCourseSelect={handleCourseSelect}
      onLogout={() => {
        localStorage.removeItem("Student.creds");
        window.location.href = "/";
      }}
      reportingPeriods={reportingPeriods}
      selectedReportingPeriod={selectedReportingPeriod}
      onSelectReportingPeriod={(idx: number) => fetchGradebook(idx)}
      onRefresh={() => fetchGradebook(selectedReportingPeriod)}
      lastRefreshed={lastRefreshed}
      isLoading={isLoading}
    />
  );
}

export default function GradebookPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading gradebook...</div>}>
      <GradebookPageContent />
    </Suspense>
  );
}

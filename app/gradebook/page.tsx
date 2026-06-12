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
  letterToGPA,
  loadCacheDuration,
  loadGradebookCache,
  saveGradebookCache,
} from "@/utils/gradebook";
import {
  getStoredCredentials,
  clearStoredCredentials,
  synergyPost,
} from "@/lib/clientApi";
import { Skeleton } from "@/components/ui/skeleton";

function GradebookPageContent() {
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
  const [cumGPA, setCumGPA] = useState<{
    value: string;
    label: string;
    rawPoints: number;
    rawCredits: number;
  } | null>(null);
  const REPORTING_PERIOD_STORAGE_KEY = "Student.lastReportingPeriod";
  const QUICK_STATS_STORAGE_KEY = "Student.quickStats";

  const initialCourseId = searchParams.get("course");
  const initialSticky = searchParams.get("sticky") === "1";

  const updateURL = useCallback(
    (params: { courseId?: string | null; sticky?: boolean }) => {
      const current = new URLSearchParams(searchParams.toString());

      if (params.courseId) {
        current.set("course", params.courseId);
      } else if (params.courseId === null) {
        current.delete("course");
      }

      if (params.sticky !== undefined) {
        if (params.sticky) {
          current.set("sticky", "1");
        } else {
          current.delete("sticky");
        }
      }

      const queryString = current.toString();
      const newURL = queryString ? `/gradebook?${queryString}` : "/gradebook";
      router.push(newURL, { scroll: false });
    },
    [searchParams, router],
  );

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
        const rawScore = currentMark?._CalculatedScoreRaw;
        const hasPortalGrade =
          rawScore != null && rawScore !== "" && rawScore !== "0";
        let effectivePct = hasPortalGrade ? Number(rawScore) : NaN;
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
        const letter = numericToLetterGrade(effectivePct);
        const gpaPoints = gpaScale[letter];
        if (
          Number.isFinite(effectivePct) &&
          letter !== "N/A" &&
          gpaPoints != null
        ) {
          gradedCourses++;
          totalGPAPoints += gpaPoints;
        }
        const assignments: Assignment[] =
          currentMark?.Assignments?.Assignment || [];
        for (const a of assignments) {
          const note = (a._Notes || "").trim().toLowerCase();
          if (note === "missing") missingCount++;
        }
      }

      const overallGPA =
        gradedCourses > 0 ? (totalGPAPoints / gradedCourses).toFixed(2) : "N/A";
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

  type RawRP = {
    _Index?: string;
    _GradePeriod?: string;
    _StartDate?: string;
    _EndDate?: string;
  };

  const applyGradebookData = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any, reportPeriodIndex: number | null, refreshedAt: Date) => {
      const periodArrayRaw = data?.ReportingPeriods?.ReportPeriod;
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
      setLastRefreshed(refreshedAt);
    },
    [computeAndStoreQuickStats],
  );

  const fetchGradebook = useCallback(
    async (reportPeriodIndex: number | null = null, bypassCache = false) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      const credentials = getStoredCredentials();
      if (!credentials) {
        window.location.href = "/login";
        inFlightRef.current = false;
        return;
      }

      if (!bypassCache) {
        const cacheDurationMs = loadCacheDuration() * 60 * 1000;
        if (cacheDurationMs > 0) {
          const cached = loadGradebookCache(reportPeriodIndex);
          if (cached && Date.now() - cached.timestamp < cacheDurationMs) {
            applyGradebookData(
              cached.data,
              reportPeriodIndex,
              new Date(cached.timestamp),
            );
            setIsLoading(false);
            inFlightRef.current = false;
            return;
          }
        }
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await synergyPost<Record<string, unknown>>(
          "/api/synergy/gradebook",
          credentials,
          reportPeriodIndex != null
            ? { reportPeriod: reportPeriodIndex }
            : undefined,
        );
        if (data["@ErrorMessage"]) {
          throw new Error(String(data["@ErrorMessage"]));
        }
        saveGradebookCache(reportPeriodIndex, data);
        applyGradebookData(data, reportPeriodIndex, new Date());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
        inFlightRef.current = false;
      }
    },
    [applyGradebookData],
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
    const fetchCumGPA = async () => {
      try {
        const cached = localStorage.getItem("Student.cumGPA");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (
            typeof parsed?.rawPoints === "number" &&
            typeof parsed?.rawCredits === "number"
          ) {
            setCumGPA(parsed);
            return;
          }
          localStorage.removeItem("Student.cumGPA");
        }
        const credentials = getStoredCredentials();
        if (!credentials) return;
        type HistoryCourse = {
          Mark: string;
          CreditsAttempted: string;
          CHSType: string;
        };
        const json = await synergyPost<{
          courseHistory?: Array<{ Terms: Array<{ Courses: HistoryCourse[] }> }>;
        }>("/api/synergy/history", credentials, { timeout_ms: 15000 });
        const history = json?.courseHistory ?? [];

        const allCourses: HistoryCourse[] = history.flatMap((g) =>
          g.Terms.flatMap((t) => t.Courses),
        );

        const isHS = (c: HistoryCourse) => {
          const t = (c.CHSType ?? "").toLowerCase();
          return t.includes("high") || t.includes("secondary");
        };
        const isMS = (c: HistoryCourse) => {
          const t = (c.CHSType ?? "").toLowerCase();
          return t.includes("middle") || t.includes("junior");
        };

        const hsCourses = allCourses.filter(isHS);
        const candidates =
          hsCourses.length > 0
            ? { courses: hsCourses, label: "HS Cumulative GPA" }
            : { courses: allCourses.filter(isMS), label: "MS Cumulative GPA" };

        let totalPoints = 0;
        let totalCredits = 0;
        for (const course of candidates.courses) {
          const gpaPoints = letterToGPA(course.Mark);
          const credits = parseFloat(course.CreditsAttempted);
          if (gpaPoints !== null && Number.isFinite(credits) && credits > 0) {
            totalPoints += gpaPoints * credits;
            totalCredits += credits;
          }
        }
        if (totalCredits > 0) {
          const result = {
            value: (totalPoints / totalCredits).toFixed(3),
            label: candidates.label,
            rawPoints: totalPoints,
            rawCredits: totalCredits,
          };
          setCumGPA(result);
          try {
            localStorage.setItem("Student.cumGPA", JSON.stringify(result));
          } catch {}
        }
      } catch {}
    };
    fetchCumGPA();
  }, []);

  useEffect(() => {
    if (!gradebookData || !initialCourseId) return;

    const gbRoot = gradebookData.data?.Gradebook || gradebookData.data || {};
    const courses: Course[] = (gbRoot?.Courses?.Course as Course[]) || [];
    const course = courses.find((c) => c?._CourseID === initialCourseId);

    if (course && !selectedCourse) {
      setSelectedCourse(course);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradebookData, initialCourseId]);

  const handleCourseSelect = useCallback(
    (course: Course) => {
      setSelectedCourse(course);
      updateURL({ courseId: course._CourseID });
    },
    [updateURL],
  );

  const handleBack = useCallback(() => {
    setSelectedCourse(null);
    updateURL({ courseId: null, sticky: false });
  }, [updateURL]);

  const handleStateChange = useCallback(
    (sticky: boolean) => {
      const currentSticky = searchParams.get("sticky") === "1";
      if (sticky !== currentSticky) {
        updateURL({ sticky });
      }
    },
    [searchParams, updateURL],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 py-6">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-9 w-64" />
            </div>
          </div>
          <div className="flex items-center space-x-10 md:self-start">
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-8 ml-auto" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-row space-x-6 items-center">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-5 w-14" />
              </div>
              <div className="ml-4 pt-1 space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-20" />
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
    const gbRoot = gradebookData.data?.Gradebook || gradebookData.data || {};
    const allCourses: Course[] = (gbRoot?.Courses?.Course as Course[]) || [];
    return (
      <CourseDetail
        course={selectedCourse}
        onBack={handleBack}
        initialSticky={initialSticky}
        onStateChange={handleStateChange}
        allCourses={allCourses}
      />
    );
  }
  return (
    <Dashboard
      gradebookData={gradebookData}
      onCourseSelect={handleCourseSelect}
      onLogout={() => {
        clearStoredCredentials();
        window.location.href = "/login";
      }}
      reportingPeriods={reportingPeriods}
      selectedReportingPeriod={selectedReportingPeriod}
      onSelectReportingPeriod={(idx: number) => fetchGradebook(idx)}
      onRefresh={() => fetchGradebook(selectedReportingPeriod, true)}
      lastRefreshed={lastRefreshed}
      isLoading={isLoading}
      cumGPA={cumGPA}
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

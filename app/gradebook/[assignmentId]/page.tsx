"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Assignment, Course, Mark, GradebookData } from "@/types/gradebook";
import { formatDate, calculatePercentage } from "@/utils/gradebook";
import Loading from "@/components/loadingfunc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface InternalGradebookRoot {
  Gradebook?: { Courses?: { Course?: Course[] } };
  Courses?: { Course?: Course[] };
  [k: string]: unknown;
}

function extractCourses(data: unknown): Course[] {
  if (!data || typeof data !== "object" || data === null) return [];
  const hasGradebook =
    typeof data === "object" &&
    data !== null &&
    "Gradebook" in data &&
    typeof (data as InternalGradebookRoot).Gradebook === "object";
  const root: InternalGradebookRoot = hasGradebook
    ? ((data as InternalGradebookRoot).Gradebook ?? {})
    : (data as InternalGradebookRoot);
  return (root?.Courses?.Course as Course[]) || [];
}

function getCurrentMark(m: Mark | Mark[] | undefined): Mark | null {
  if (!m) return null;
  if (Array.isArray(m)) return m[m.length - 1] || null;
  return m;
}

export default function AssignmentDetailPage() {
  const params = useParams<{ assignmentId: string }>();
  const router = useRouter();
  const assignmentId = params.assignmentId;
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportingPeriod, setReportingPeriod] = useState<number | null>(null);
  const inFlightRef = useRef(false);

  const REPORTING_PERIOD_STORAGE_KEY = "Student.lastReportingPeriod";

  const fetchGradebook = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const creds = localStorage.getItem("Student.creds");
    if (!creds) {
      router.push("/login");
      return;
    }
    const credentials = JSON.parse(creds);
    let stored: number | null = null;
    try {
      const raw = localStorage.getItem(REPORTING_PERIOD_STORAGE_KEY);
      if (raw != null && raw !== "") {
        const parsed = Number(raw);
        if (!isNaN(parsed)) stored = parsed;
      }
    } catch {}

    try {
      setIsLoading(true);
      setError(null);
      const body =
        stored != null ? { ...credentials, reportPeriod: stored } : credentials;
      const res = await fetch("/api/synergy/gradebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data: GradebookData["data"] = await res.json();
      const maybeErr = (data as Record<string, unknown>)["@ErrorMessage"];
      if (typeof maybeErr === "string" && maybeErr) {
        if (process.env.NODE_ENV === "development") {
          throw new Error(maybeErr);
        }
      }
      const courses = extractCourses(data);
      for (const c of courses) {
        const mark = getCurrentMark(c?.Marks?.Mark);
        const assignments: Assignment[] = mark?.Assignments?.Assignment || [];
        const found = assignments.find(
          (a) => String(a._GradebookID) === assignmentId,
        );
        if (found) {
          setAssignment(found);
          setCourse(c);
          break;
        }
      }
      setReportingPeriod(stored);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [assignmentId, router]);

  useEffect(() => {
    fetchGradebook();
  }, [fetchGradebook]);

  if (isLoading) return <Loading />;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!assignment) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          &larr; Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Assignment Not Found</CardTitle>
            <CardDescription>
              No assignment with ID {assignmentId} could be located
              {reportingPeriod != null
                ? ` in reporting period ${reportingPeriod}`
                : ""}
              .
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isRubric = /rubric/i.test(assignment._ScoreType || "");
  let scoreDisplay: string = "—";
  if (isRubric) {
    if (assignment._Score) scoreDisplay = assignment._Score;
  } else if (assignment._Score && assignment._ScoreMaxValue) {
    scoreDisplay = `${assignment._Score} / ${assignment._ScoreMaxValue}`;
  } else if (assignment._Score) {
    scoreDisplay = assignment._Score;
  }

  let percent: string = "—";
  if (assignment._Score && assignment._ScoreMaxValue) {
    const pct = calculatePercentage(
      Number(assignment._Score),
      Number(assignment._ScoreMaxValue),
    );
    if (Number.isFinite(pct)) percent = `${pct}%`;
  }

  const pointsRaw = assignment._Points?.replace(/of/i, "/");
  let pointsDisplay = assignment._Points || "—";
  if (pointsRaw) {
    const m = pointsRaw.match(/([0-9]*\.?[0-9]+)\s*\/\s*([0-9]*\.?[0-9]+)/);
    if (m) {
      const s = parseFloat(m[1]);
      const p = parseFloat(m[2]);
      const pct = calculatePercentage(s, p);
      if (Number.isFinite(pct)) percent = `${pct}%`;
      pointsDisplay = `${s} / ${p}`;
    }
  }

  const derivedPoint = assignment._Point ? Number(assignment._Point) : NaN;
  const derivedPossible = assignment._PointPossible
    ? Number(assignment._PointPossible)
    : NaN;
  const derivedRatio =
    Number.isFinite(derivedPoint) &&
    Number.isFinite(derivedPossible) &&
    derivedPossible > 0
      ? derivedPoint / derivedPossible
      : NaN;
  if (Number.isFinite(derivedRatio)) {
    type AugmentedAssignment = Assignment & { __derivedScoreRatio?: number };
    (assignment as AugmentedAssignment).__derivedScoreRatio = derivedRatio;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              const id = course?._CourseID;
              const target = id
                ? `/gradebook?course=${encodeURIComponent(String(id))}`
                : "/gradebook";
              router.push(target);
            }}
          >
            &larr; Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-black dark:text-white truncate">
              {assignment._Measure || "Assignment"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              ID: {assignmentId}
              {course ? ` • ${course._CourseName}` : ""}
            </p>
          </div>
          {percent !== "—" && (
            <div className="text-right">
              <div className="text-xl font-bold text-black dark:text-white">
                {percent}
              </div>
              {scoreDisplay !== "—" && (
                <p className="text-xs text-gray-500">{scoreDisplay}</p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Assignment specific information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm dark:text-white text-black">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <Info label="Type" value={assignment._Type || "—"} />
              <Info label="Date" value={formatDate(assignment._Date)} />
              <Info
                label="Due"
                value={(function () {
                  const rawDue = assignment._DueDate;
                  let label = formatDate(rawDue);
                  try {
                    const endStr =
                      localStorage.getItem("Student.reportingPeriodEnd") || "";
                    if (endStr) {
                      const due = new Date(rawDue);
                      const end = new Date(endStr);
                      const now = new Date();
                      const sameDay =
                        due.getFullYear() === end.getFullYear() &&
                        due.getMonth() === end.getMonth() &&
                        due.getDate() === end.getDate();
                      if (
                        sameDay &&
                        due >=
                          new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            now.getDate(),
                          )
                      ) {
                        label = "Not due";
                      }
                    }
                  } catch {}
                  return label;
                })()}
              />
              <Info label="Score" value={scoreDisplay} />
              <Info label="Points" value={pointsDisplay} />
              <Info label="Notes" value={assignment._Notes || "—"} />
            </div>
            {assignment._MeasureDescription && (
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="whitespace-pre-line leading-snug text-gray-700">
                  {assignment._MeasureDescription}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
        {label}
      </p>
      <div className="text-sm dark:text-white text-black break-words">
        {value}
      </div>
    </div>
  );
}

"use client";

import { Course, Mark } from "@/types/gradebook";
import {
  loadCustomGPAScale,
  numericToLetterGrade,
  loadCalculateGradesEnabled,
} from "@/utils/gradebook";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./ui/select";

function getCurrentMark(marks: Mark | Mark[]): Mark | null {
  if (Array.isArray(marks)) {
    return marks[marks.length - 1] || null;
  }
  return marks;
}

interface GradebookRootLike {
  Gradebook?: {
    Courses?: { Course?: Course[] };
  };
  Courses?: { Course?: Course[] };
  [k: string]: unknown;
}

interface ReportingPeriodMeta {
  index: number;
  label: string;
  start: string;
  end: string;
}

interface DashboardProps {
  gradebookData: { data: GradebookRootLike };
  onCourseSelect: (course: Course) => void;
  onLogout: () => void;
  reportingPeriods?: ReportingPeriodMeta[];
  selectedReportingPeriod?: number | null;
  onSelectReportingPeriod?: (index: number) => void;
  onRefresh?: () => void;
  lastRefreshed?: Date | null;
  isLoading?: boolean;
}

export default function Dashboard({
  gradebookData,
  onCourseSelect,
  reportingPeriods = [],
  selectedReportingPeriod = null,
  onSelectReportingPeriod,
  onRefresh,
  lastRefreshed,
  isLoading = false,
}: DashboardProps) {
  const gbRoot = gradebookData.data.Gradebook ?? gradebookData.data;
  const courses: Course[] = gbRoot?.Courses?.Course || [];
  const calcGrades = loadCalculateGradesEnabled();

  function recomputeCoursePercent(course: Course): number | null {
    const currentMark = getCurrentMark(course.Marks.Mark);
    if (!currentMark) return null;
    const assignments = currentMark.Assignments?.Assignment || [];
    let earned = 0;
    let possible = 0;
    for (const a of assignments) {
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
    }
    if (possible <= 0) return null;
    return (earned / possible) * 100;
  }

  const gpaScale = loadCustomGPAScale();
  const computationBasis = courses.map((course) => {
    const currentMark = getCurrentMark(course.Marks.Mark);
    const portalRaw = Number(currentMark?._CalculatedScoreRaw) || 0;
    const localPct = recomputeCoursePercent(course);
    const effectivePct = calcGrades && localPct != null ? localPct : portalRaw;
    const letter = numericToLetterGrade(Math.round(effectivePct));
    return { course, effectivePct, letter };
  });
  const validCourses = computationBasis.filter(
    (c) => Number.isFinite(c.effectivePct) && (c.effectivePct as number) > 0,
  );
  const totalPoints = validCourses.reduce(
    (acc, c) => acc + (gpaScale[c.letter] ?? 0),
    0,
  );
  const gpa = validCourses.length
    ? (totalPoints / validCourses.length).toFixed(2)
    : "0.00";

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-neutral-950 p-9">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 py-6">
          <div className="flex-1">
            <p className="text-xl font-medium pb-3">Gradebook</p>
            {!!reportingPeriods.length && (
              <div className="flex items-center gap-2 text-sm">
                <label className="font-medium">Reporting Period:</label>
                <Select
                  disabled={isLoading}
                  value={
                    selectedReportingPeriod != null
                      ? String(selectedReportingPeriod)
                      : undefined
                  }
                  onValueChange={(val) =>
                    onSelectReportingPeriod?.(Number(val))
                  }
                >
                  <SelectTrigger className="w-[260px]">
                    <SelectValue
                      className="text-xs"
                      placeholder="Select period"
                    />
                  </SelectTrigger>
                  <SelectContent className="p-1">
                    {reportingPeriods.map((rp) => (
                      <SelectItem key={rp.index} value={rp.index.toString()}>
                        {rp.label} ({rp.start} – {rp.end})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 md:self-start">
            <div className="text-right">
              <div className="text-sm text-gray-500">GPA</div>
              <div className="text-2xl font-bold">{gpa}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-neutral-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-900">
            {computationBasis.map(
              ({ course, effectivePct, letter }, index: number) => {
                const currentMark = getCurrentMark(course.Marks.Mark);
                const portalRaw = Number(currentMark?._CalculatedScoreRaw) || 0;
                const displayScore =
                  calcGrades && Number.isFinite(effectivePct)
                    ? letter
                    : currentMark?._CalculatedScoreString || "N/A";
                return (
                  <div
                    key={course._CourseID}
                    className={`p-4 cursor-pointer transition-colors ${
                      index !== computationBasis.length - 1
                        ? "border-b border-gray-200 dark:border-zinc-900"
                        : ""
                    }`}
                    onClick={() => onCourseSelect(course)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-row space-x-5">
                        <span className="font-semibold text-black dark:text-white text-lg">
                          {course._Period}: {course._Title}
                        </span>
                        <span className="text-gray-500 text-sm mt-1">
                          {course._Staff} • Room {course._Room}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="ml-4 pt-2">
                        <div className="text-3xl font-bold text-left">
                          {displayScore}
                        </div>
                        <div className="text-sm text-gray-500 text-left">
                          {calcGrades
                            ? Number.isFinite(effectivePct)
                              ? `${(effectivePct as number).toFixed(1)}%`
                              : "No grade"
                            : portalRaw > 0
                              ? `${portalRaw.toFixed(1)}%`
                              : "No grade"}
                        </div>
                      </div>
                      {(() => {
                        const assignments =
                          currentMark?.Assignments?.Assignment || [];
                        const missingCount = assignments.filter(
                          (a) =>
                            a._Notes &&
                            a._Notes.toLowerCase().trim() === "missing",
                        ).length;

                        return (
                          <div
                            className={`text-xs ${missingCount > 0 ? "text-red-500" : "text-gray-500"} text-right`}
                          >
                            {missingCount} missing assignment
                            {missingCount === 1 ? "" : "s"}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <span className="text-xs text-gray-500">
            {lastRefreshed && `Last refreshed ${lastRefreshed.toLocaleTimeString()} • `}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="text-xs hover:cursor-pointer underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh
            </button>
          </span>
        </div>
      </div>
    </>
  );
}

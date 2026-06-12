"use client";

import * as React from "react";
import { Course, Mark } from "@/types/gradebook";
import {
  loadCustomGPAScale,
  loadCustomGradeBounds,
  numericToLetterGrade,
  loadCalculateGradesEnabled,
  formatDate,
} from "@/utils/gradebook";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { RotateCcw } from "lucide-react";

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
  cumGPA?: {
    value: string;
    label: string;
    rawPoints: number;
    rawCredits: number;
  } | null;
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
  cumGPA,
}: DashboardProps) {
  const gbRoot = gradebookData.data.Gradebook ?? gradebookData.data;
  const courses: Course[] = gbRoot?.Courses?.Course || [];
  const calcGrades = loadCalculateGradesEnabled();

  const [hypotheticalMode, setHypotheticalMode] = React.useState(false);
  const [hypoLetters, setHypoLetters] = React.useState<Record<string, string>>(
    {},
  );
  const letterOptions = React.useMemo(
    () => Array.from(new Set(loadCustomGradeBounds().map((b) => b.letter))),
    [],
  );

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
    const rawScore = currentMark?._CalculatedScoreRaw;
    const hasGrade = rawScore != null && rawScore !== "" && rawScore !== "0";
    const portalRaw = hasGrade ? Number(rawScore) : NaN;
    const localPct = recomputeCoursePercent(course);
    const effectivePct = calcGrades && localPct != null ? localPct : portalRaw;
    const letter = numericToLetterGrade(Math.round(effectivePct));
    const isValidForGPA = Number.isFinite(effectivePct) && letter !== "N/A";
    return { course, effectivePct, letter, isValidForGPA };
  });
  const validCourses = computationBasis.filter((c) => c.isValidForGPA);
  const totalPoints = validCourses.reduce(
    (acc, c) => acc + (gpaScale[c.letter] ?? 0),
    0,
  );
  const gpa = validCourses.length
    ? (totalPoints / validCourses.length).toFixed(2)
    : "N/A";

  const hasOverrides =
    hypotheticalMode && Object.keys(hypoLetters).length > 0;
  const hypoBasis = computationBasis.map((c) => {
    const override = hypotheticalMode
      ? hypoLetters[c.course._CourseID]
      : undefined;
    if (!override) return c;
    return {
      ...c,
      letter: override,
      isValidForGPA: gpaScale[override] != null,
    };
  });
  const hypoValid = hypoBasis.filter((c) => c.isValidForGPA);
  const hypoPoints = hypoValid.reduce(
    (acc, c) => acc + (gpaScale[c.letter] ?? 0),
    0,
  );
  const hypoGPA = hypoValid.length
    ? (hypoPoints / hypoValid.length).toFixed(2)
    : "N/A";

  const totalGPA = (() => {
    if (!cumGPA || validCourses.length === 0) return null;
    const combinedPoints = cumGPA.rawPoints + totalPoints;
    const combinedCredits = cumGPA.rawCredits + validCourses.length;
    const totalLabel = cumGPA.label
      .replace("Cumulative", "Total")
      .replace("CumGPA", "Total GPA");
    return {
      value: (combinedPoints / combinedCredits).toFixed(4),
      label: totalLabel,
    };
  })();

  const hypoTotalGPA = (() => {
    if (!cumGPA || hypoValid.length === 0) return null;
    const combinedPoints = cumGPA.rawPoints + hypoPoints;
    const combinedCredits = cumGPA.rawCredits + hypoValid.length;
    return (combinedPoints / combinedCredits).toFixed(4);
  })();

  const arrowClass = (from: string, to: string) =>
    Number(to) > Number(from)
      ? "text-green-600 dark:text-green-400"
      : Number(to) < Number(from)
        ? "text-red-600 dark:text-red-400"
        : "text-zinc-500";

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 py-6">
          <div className="flex-1">
            <p className="text-xl font-medium pb-3">Gradebook</p>
            {!!reportingPeriods.length && (
              <div className="flex items-center gap-2 text-sm">
                <label className="font-medium">Reporting Period:</label>
                <div className="flex flex-col gap-0.5">
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
                    <SelectTrigger className="w-60">
                      <SelectValue
                        className="text-xs"
                        placeholder="Select period"
                      />
                    </SelectTrigger>
                    <SelectContent className="p-1">
                      {reportingPeriods.map((rp) => (
                        <SelectItem key={rp.index} value={rp.index.toString()}>
                          {rp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(() => {
                    const selected = reportingPeriods.find(
                      (rp) => rp.index === selectedReportingPeriod,
                    );
                    if (!selected?.start || !selected?.end) return null;
                    return (
                      <p className="text-xs text-zinc-500">
                        {formatDate(selected.start)} –{" "}
                        {formatDate(selected.end)}
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          {(gpa !== "N/A" || (hasOverrides && hypoGPA !== "N/A")) && (
            <div className="flex items-center space-x-8 md:self-start">
              <div className="text-right">
                <div className="text-sm text-zinc-500">Semester GPA</div>
                <div className="text-2xl font-bold">
                  {gpa}
                  {hasOverrides && hypoGPA !== gpa && (
                    <span className={arrowClass(gpa, hypoGPA)}>
                      {" "}
                      → {hypoGPA}
                    </span>
                  )}
                </div>
              </div>
              {cumGPA != null && (
                <div className="text-right">
                  <div className="text-sm text-zinc-500">{cumGPA.label}</div>
                  <div className="text-2xl font-bold">{cumGPA.value}</div>
                </div>
              )}
              {totalGPA != null && cumGPA != null && (
                <div className="text-right">
                  <div className="text-sm text-zinc-500">{totalGPA.label}</div>
                  <div className="text-2xl font-bold">
                    {totalGPA.value}
                    {hasOverrides &&
                      hypoTotalGPA != null &&
                      hypoTotalGPA !== totalGPA.value && (
                        <span
                          className={arrowClass(totalGPA.value, hypoTotalGPA)}
                        >
                          {" "}
                          → {hypoTotalGPA}
                        </span>
                      )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pb-3">
          {hasOverrides && (
            <Button
              onClick={() => setHypoLetters({})}
              size="sm"
              variant="outline"
              className="h-8"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset All
            </Button>
          )}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <Checkbox
              checked={hypotheticalMode}
              onCheckedChange={(checked) =>
                setHypotheticalMode(checked === true)
              }
            />
            <span>Hypothetical Mode</span>
          </label>
        </div>

        <div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
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
                        ? "border-b border-zinc-200 dark:border-zinc-800"
                        : ""
                    }`}
                    onClick={() => onCourseSelect(course)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-row space-x-5">
                        <span className="font-semibold text-black dark:text-white text-lg">
                          {course._Period}: {course._Title}
                        </span>
                        <span className="text-zinc-500 text-sm mt-1">
                          {course._Staff} • Room {course._Room}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="ml-4 pt-2">
                        {hypotheticalMode ? (
                          (() => {
                            const id = course._CourseID;
                            const currentLetter = letterOptions.includes(
                              displayScore,
                            )
                              ? displayScore
                              : letterOptions.includes(letter)
                                ? letter
                                : undefined;
                            const override = hypoLetters[id];
                            return (
                              // keep clicks here from opening the course
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block"
                              >
                                <Select
                                  value={override ?? currentLetter}
                                  onValueChange={(v) =>
                                    setHypoLetters((prev) => ({
                                      ...prev,
                                      [id]: v,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="py-5 pl-5 w-24 h-11 text-2xl font-bold">
                                    <SelectValue placeholder="—" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {letterOptions.map((l) => (
                                      <SelectItem key={l} value={l}>
                                        {l}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-3xl font-bold text-left">
                            {displayScore}
                          </div>
                        )}
                        <div className="text-sm text-zinc-500 text-left pt-1">
                          {calcGrades
                            ? Number.isFinite(effectivePct)
                              ? `${(effectivePct as number).toFixed(1)}%`
                              : "No grade"
                            : portalRaw > 0
                              ? `${portalRaw.toFixed(1)}%`
                              : "No grade"}
                          {" "}
                          {hypotheticalMode && (
                            <span>({letter})</span>
                          )}
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
                            className={`text-xs ${missingCount > 0 ? "text-red-500" : "text-zinc-500"} text-right`}
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
          <span className="text-xs text-zinc-500">
            {lastRefreshed &&
              `Last refreshed ${lastRefreshed.toLocaleTimeString()} • `}
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

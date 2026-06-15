"use client";

import { Course, Mark, Assignment } from "@/types/gradebook";
import {
  getGradeColor,
  getCourseIcon,
  numericToLetterGrade,
  loadCalculateGradesEnabled,
  isCalculateGradesSet,
  loadCustomGPAScale,
} from "@/utils/gradebook";
import {
  parseSynergyAssignment,
  getSynergyCourseAssignmentCategories,
  getCalculableAssignments,
  getPointsByCategory,
  calculateCourseGradePercentageFromCategories,
  calculateCourseGradePercentageFromTotals,
  getAssignmentPointTotals,
} from "@/lib/gradeCalc";
import * as React from "react";
import { GradeChart } from "@/components/GradeChart";
import { GradeBreakdown } from "@/components/GradeBreakdown";
import { AssignmentsTable } from "@/components/AssignmentsTable";
// import { TargetGradeCalc } from "@/components/TargetGradeCalc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

function getCurrentMark(marks: Mark | Mark[]): Mark | null {
  if (Array.isArray(marks)) {
    return marks[marks.length - 1] || null;
  }
  return marks;
}

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  initialSticky?: boolean;
  onStateChange?: (sticky: boolean) => void;
  hideGradeCalcWarning?: boolean;
  allCourses?: Course[];
}

export default function CourseDetail({
  course,
  onBack,
  initialSticky = false,
  onStateChange,
  hideGradeCalcWarning = false,
  allCourses,
}: CourseDetailProps) {
  const marks = course.Marks.Mark;
  const currentMark = getCurrentMark(marks);
  const originalAssignments = React.useMemo(
    () => currentMark?.Assignments?.Assignment || [],
    [currentMark],
  );

  const [hypotheticalMode, setHypotheticalMode] = React.useState(false);
  const [hypotheticalScores, setHypotheticalScores] = React.useState<
    Record<string, { score: string; max: string }>
  >({});
  const [hypotheticalCategories, setHypotheticalCategories] = React.useState<
    Record<string, string>
  >({});
  const [hypotheticalNewAssignments, setHypotheticalNewAssignments] =
    React.useState<Assignment[]>([]);
  const [hypotheticalDeletedIds, setHypotheticalDeletedIds] = React.useState<
    Set<string>
  >(new Set());
  const [hypotheticalNames, setHypotheticalNames] = React.useState<
    Record<string, string>
  >({});

  const effectiveAssignments = React.useMemo(() => {
    if (!hypotheticalMode) return originalAssignments;

    const applyOverrides = (a: Assignment): Assignment => {
      const hypoScore = hypotheticalScores[a._GradebookID];
      const hypoCategory = hypotheticalCategories[a._GradebookID];
      const hypoName = hypotheticalNames[a._GradebookID];

      if (!hypoScore && !hypoCategory && !hypoName) return a;

      const result = { ...a };

      if (hypoScore) {
        result._Score = hypoScore.score;
        result._Point = hypoScore.score;
        result._ScoreMaxValue = hypoScore.max;
        result._PointPossible = hypoScore.max;
        result._DisplayScore = `${hypoScore.score} out of ${hypoScore.max}`;
        result._Points = `${hypoScore.score} / ${hypoScore.max}`;
      }

      if (hypoCategory) {
        result._Type = hypoCategory;
      }

      if (hypoName) {
        result._Measure = hypoName;
      }

      return result;
    };

    const base = originalAssignments
      .filter((a) => !hypotheticalDeletedIds.has(a._GradebookID))
      .map(applyOverrides);
    const added = hypotheticalNewAssignments.map(applyOverrides);
    return added.length > 0 ? [...base, ...added] : base;
  }, [
    originalAssignments,
    hypotheticalMode,
    hypotheticalDeletedIds,
    hypotheticalScores,
    hypotheticalCategories,
    hypotheticalNames,
    hypotheticalNewAssignments,
  ]);

  const handleHypotheticalScoreChange = React.useCallback(
    (id: string, score: string, max: string) => {
      setHypotheticalScores((prev) => ({
        ...prev,
        [id]: { score, max },
      }));
    },
    [],
  );

  const handleHypotheticalCategoryChange = React.useCallback(
    (id: string, category: string) => {
      setHypotheticalCategories((prev) => ({
        ...prev,
        [id]: category,
      }));
    },
    [],
  );

  const handleHypotheticalNameChange = React.useCallback(
    (id: string, name: string) => {
      setHypotheticalNames((prev) => ({
        ...prev,
        [id]: name,
      }));
    },
    [],
  );

  const dontShowGradeCalcWarning = localStorage.getItem(
    "Student.dontShowGradeCalcWarning",
  );

  const isRubric = React.useCallback(
    (a: Assignment | undefined | null) =>
      !!a && /rubric/i.test(a._ScoreType || ""),
    [],
  );

  const recalcTotals = React.useMemo(() => {
    const parsedAssignments = effectiveAssignments.map((a: Assignment) =>
      parseSynergyAssignment(a),
    );
    const calculable = getCalculableAssignments(parsedAssignments);

    const gradeCalcs =
      currentMark?.GradeCalculationSummary?.AssignmentGradeCalc;
    if (gradeCalcs && gradeCalcs.length > 0) {
      const categories = getSynergyCourseAssignmentCategories(course);
      if (categories && categories.length > 0) {
        const pointsByCategory = getPointsByCategory(calculable);
        const earned = Object.values(pointsByCategory).reduce(
          (acc, v) => acc + v.pointsEarned,
          0,
        );
        const possible = Object.values(pointsByCategory).reduce(
          (acc, v) => acc + v.pointsPossible,
          0,
        );
        const pct = calculateCourseGradePercentageFromCategories(
          pointsByCategory,
          categories,
        );
        return { earned, possible, pct, pointsByCategory };
      }
    }

    const totals = getAssignmentPointTotals(calculable);
    const pct = calculateCourseGradePercentageFromTotals(calculable);
    return {
      earned: totals.pointsEarned,
      possible: totals.pointsPossible,
      pct,
      pointsByCategory: undefined,
    };
  }, [effectiveAssignments, course, currentMark]);

  const hasRubric = React.useMemo(
    () => originalAssignments.some((a) => isRubric(a)),
    [originalAssignments, isRubric],
  );

  const gpaPreview = React.useMemo(() => {
    if (!hypotheticalMode || !allCourses || allCourses.length === 0) {
      return null;
    }
    const gpaScale = loadCustomGPAScale();
    const pointsFor = (pct: number): number | null => {
      if (!Number.isFinite(pct)) return null;
      const letter = numericToLetterGrade(pct);
      const points = gpaScale[letter];
      return letter !== "N/A" && points != null ? points : null;
    };
    let beforeSum = 0;
    let beforeCount = 0;
    let afterSum = 0;
    let afterCount = 0;
    for (const c of allCourses) {
      const mark = c?.Marks?.Mark ? getCurrentMark(c.Marks.Mark) : null;
      const raw = mark?._CalculatedScoreRaw;
      const hasGrade = raw != null && raw !== "" && raw !== "0";
      const portalPct = hasGrade ? Number(raw) : NaN;
      const before = pointsFor(portalPct);
      if (before != null) {
        beforeSum += before;
        beforeCount++;
      }
      const isThisCourse = c._CourseID === course._CourseID;
      const afterPct =
        isThisCourse && Number.isFinite(recalcTotals.pct)
          ? recalcTotals.pct
          : portalPct;
      const after = pointsFor(afterPct);
      if (after != null) {
        afterSum += after;
        afterCount++;
      }
    }
    if (beforeCount === 0 || afterCount === 0) return null;
    return { before: beforeSum / beforeCount, after: afterSum / afterCount };
  }, [hypotheticalMode, allCourses, course._CourseID, recalcTotals.pct]);

  const courseCategories = React.useMemo(
    () => getSynergyCourseAssignmentCategories(course) || [],
    [course],
  );

  const createHypotheticalAssignment = React.useCallback(
    (prefill?: {
      name?: string;
      score?: number;
      pointsPossible?: number;
      category?: string;
    }) => {
      const gradeCalcs =
        currentMark?.GradeCalculationSummary?.AssignmentGradeCalc || [];
      const availableCategories =
        gradeCalcs.length > 0
          ? gradeCalcs.map((c) => c._Type)
          : Array.from(new Set(originalAssignments.map((a) => a._Type)));

      const category =
        prefill?.category || availableCategories[0] || "Assignment";
      const max = prefill?.pointsPossible ?? 100;
      const score = prefill?.score;
      const newId = `hypo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const today = new Date().toISOString().split("T")[0];

      const newAssignment: Assignment = {
        _Date: today,
        _DisplayScore: score != null ? `${score} / ${max}` : ` / ${max}`,
        _DropEndDate: "",
        _DropStartDate: "",
        _DueDate: today,
        _GradebookID: newId,
        _HasDropBox: "false",
        _Measure: prefill?.name || "Hypothetical Assignment",
        _MeasureDescription: "",
        _Notes: "",
        _Point: "",
        _PointPossible: String(max),
        _Points: ` / ${max}`,
        _Score: score != null ? String(score) : "",
        _ScoreCalValue: "",
        _ScoreMaxValue: String(max),
        _ScoreType: "Raw Score",
        _StudentID: "",
        _TeacherID: "",
        _TimeSincePost: "Just now",
        _TotalSecondsSincePost: "0",
        _Type: category,
        Resources: {},
        Standards: {},
      };

      setHypotheticalNewAssignments((prev) => [...prev, newAssignment]);
      if (score != null) {
        setHypotheticalScores((prev) => ({
          ...prev,
          [newId]: { score: String(score), max: String(max) },
        }));
      }
    },
    [currentMark, originalAssignments],
  );

  const handleCreateHypotheticalAssignment = React.useCallback(
    () => createHypotheticalAssignment(),
    [createHypotheticalAssignment],
  );

  const handleDeleteAssignment = React.useCallback((id: string) => {
    setHypotheticalNewAssignments((prev) =>
      prev.filter((a) => a._GradebookID !== id),
    );
    setHypotheticalDeletedIds((prev) => new Set([...prev, id]));
    setHypotheticalScores((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setHypotheticalCategories((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setHypotheticalNames((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleResetAll = React.useCallback(() => {
    setHypotheticalScores({});
    setHypotheticalCategories({});
    setHypotheticalNames({});
    setHypotheticalNewAssignments([]);
    setHypotheticalDeletedIds(new Set());
  }, []);

  const hasGradeCalcError =
    Number.isFinite(recalcTotals.pct) &&
    !!currentMark?._CalculatedScoreRaw &&
    Math.round(recalcTotals.pct) !==
      Math.round(parseFloat(currentMark._CalculatedScoreRaw || "0"));
  const calcGrades = isCalculateGradesSet()
    ? loadCalculateGradesEnabled()
    : !hasGradeCalcError;
  let effectiveLetter: string | undefined = currentMark?._CalculatedScoreString;
  let effectivePct: number | undefined = currentMark?._CalculatedScoreRaw
    ? parseFloat(currentMark._CalculatedScoreRaw)
    : undefined;
  if (calcGrades || hasRubric || hypotheticalMode) {
    if (Number.isFinite(recalcTotals.pct)) {
      effectivePct = recalcTotals.pct;
      effectiveLetter = numericToLetterGrade(Math.round(recalcTotals.pct));
    }
  }
  const gradeColorClass = getGradeColor(effectiveLetter || "");

  const icon = getCourseIcon(course._ImageType);

  const getAssignmentTypeColor = (type: string) => {
    if (
      type.toLowerCase().includes("assessment") ||
      type.toLowerCase().includes("test") ||
      type.toLowerCase().includes("quiz")
    ) {
      return "bg-red-100 text-red-800";
    } else if (
      type.toLowerCase().includes("homework") ||
      type.toLowerCase().includes("classwork")
    ) {
      return "bg-blue-100 text-blue-800";
    } else if (type.toLowerCase().includes("participation")) {
      return "bg-green-100 text-green-800";
    } else if (type.toLowerCase().includes("fitness")) {
      return "bg-purple-100 text-purple-800";
    }
    return "bg-zinc-100 text-zinc-800";
  };

  const [chartSticky, setChartSticky] = React.useState(initialSticky);

  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (onStateChange) onStateChange(chartSticky);
  }, [chartSticky, onStateChange]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="bg-white dark:bg-zinc-900 shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <button
              onClick={onBack}
              className="mb-4 flex items-center text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
            <div
              className={`flex ${
                chartSticky ? "items-center" : "items-start"
              } justify-between gap-4`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl md:text-3xl shrink-0">{icon}</span>
                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl font-semibold text-black dark:text-white truncate">
                    {course._CourseName}
                  </h1>
                  {!chartSticky && (
                    <>
                      <p className="text-zinc-500 text-sm">
                        {course._CourseID} • Period {course._Period} • Room{" "}
                        {course._Room}
                      </p>
                      <p className="text-zinc-500 text-sm">
                        {course._Staff} • {course._StaffEMail}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`inline-flex px-3 py-1.5 rounded-md text-base md:text-lg font-bold ${gradeColorClass}`}
                >
                  {effectiveLetter || "N/A"}
                </div>
                <p className="text-xs md:text-sm text-zinc-500 mt-1">
                  {effectivePct != null && Number.isFinite(effectivePct)
                    ? `${effectivePct.toFixed(2)}%`
                    : "N/A"}
                </p>
                {gpaPreview && (
                  <p
                    className={`text-xs mt-1 ${
                      gpaPreview.after - gpaPreview.before > 0.0005
                        ? "text-green-600 dark:text-green-400"
                        : gpaPreview.after - gpaPreview.before < -0.0005
                          ? "text-red-600 dark:text-red-400"
                          : "text-zinc-500"
                    }`}
                  >
                    GPA {gpaPreview.before.toFixed(3)} →{" "}
                    {gpaPreview.after.toFixed(3)}
                  </p>
                )}
              </div>
            </div>
            {!hideGradeCalcWarning &&
              !dontShowGradeCalcWarning &&
              !calcGrades &&
              !hasRubric &&
              !hypotheticalMode &&
              hasGradeCalcError && (
                <>
                  <div className="pt-5" />
                  <Alert variant="destructive">
                    <AlertTriangle />
                    <AlertTitle>Grade Calculation Error</AlertTitle>
                    <AlertDescription>
                      Your class{"'"}s official grade does not match Student
                      {"'"}s calculated grade percentage. This could be because
                      of hidden assignments that aren{"'"}t marked as visible,
                      or that Student isn{"'"}t isn{"'"}t calculating your grade
                      correctly. Your overall grade is still correct, but other
                      areas might be off
                    </AlertDescription>
                  </Alert>
                </>
              )}
            {chartSticky && (
              <div className="mt-2 -mb-2 -mx-1">
                <GradeChart
                  assignments={effectiveAssignments}
                  categories={courseCategories}
                  sticky={chartSticky}
                  onStickyChange={setChartSticky}
                  forceStickyInHeader
                  minimal
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {!chartSticky && (
          <GradeChart
            assignments={effectiveAssignments}
            categories={courseCategories}
            sticky={chartSticky}
            onStickyChange={setChartSticky}
          />
        )}
        <GradeBreakdown
          calcs={
            currentMark?.GradeCalculationSummary?.AssignmentGradeCalc || []
          }
          assignments={effectiveAssignments}
        />
        {/* {hypotheticalMode && (
          <TargetGradeCalc
            currentPct={recalcTotals.pct}
            categories={courseCategories}
            pointsByCategory={recalcTotals.pointsByCategory}
            totals={{
              earned: recalcTotals.earned,
              possible: recalcTotals.possible,
            }}
            onAddAssignment={createHypotheticalAssignment}
          />
        )} */}
        <AssignmentsTable
          assignments={effectiveAssignments}
          getTypeColor={getAssignmentTypeColor}
          hypotheticalMode={hypotheticalMode}
          onToggleHypothetical={setHypotheticalMode}
          onEditScore={handleHypotheticalScoreChange}
          onEditCategory={handleHypotheticalCategoryChange}
          onEditName={handleHypotheticalNameChange}
          onCreateAssignment={handleCreateHypotheticalAssignment}
          onDeleteAssignment={handleDeleteAssignment}
          onResetAll={handleResetAll}
        />
      </div>
    </div>
  );
}

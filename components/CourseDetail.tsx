"use client";

import { Course, Mark, Assignment } from "@/types/gradebook";
import {
  getGradeColor,
  getCourseIcon,
  numericToLetterGrade,
  loadCalculateGradesEnabled,
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
}

export default function CourseDetail({
  course,
  onBack,
  initialSticky = false,
  onStateChange,
  hideGradeCalcWarning = false,
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

  const effectiveAssignments = React.useMemo(() => {
    let modifiedAssignments = originalAssignments;

    if (
      hypotheticalMode &&
      (Object.keys(hypotheticalScores).length > 0 ||
        Object.keys(hypotheticalCategories).length > 0)
    ) {
      modifiedAssignments = originalAssignments.map((a) => {
        const hypoScore = hypotheticalScores[a._GradebookID];
        const hypoCategory = hypotheticalCategories[a._GradebookID];

        if (!hypoScore && !hypoCategory) return a;

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

        return result;
      });
    }

    if (hypotheticalMode && hypotheticalNewAssignments.length > 0) {
      const modifiedNewAssignments = hypotheticalNewAssignments.map((a) => {
        const hypoScore = hypotheticalScores[a._GradebookID];
        const hypoCategory = hypotheticalCategories[a._GradebookID];

        if (!hypoScore && !hypoCategory) return a;

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

        return result;
      });
      return [...modifiedAssignments, ...modifiedNewAssignments];
    }

    return modifiedAssignments;
  }, [
    originalAssignments,
    hypotheticalMode,
    hypotheticalScores,
    hypotheticalCategories,
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
        return { earned, possible, pct };
      }
    }

    const totals = getAssignmentPointTotals(calculable);
    const pct = calculateCourseGradePercentageFromTotals(calculable);
    return {
      earned: totals.pointsEarned,
      possible: totals.pointsPossible,
      pct,
    };
  }, [effectiveAssignments, course, currentMark]);

  const hasRubric = React.useMemo(
    () => originalAssignments.some((a) => isRubric(a)),
    [originalAssignments, isRubric],
  );

  const courseCategories = React.useMemo(
    () => getSynergyCourseAssignmentCategories(course) || [],
    [course],
  );

  const handleCreateHypotheticalAssignment = React.useCallback(() => {
    const gradeCalcs =
      currentMark?.GradeCalculationSummary?.AssignmentGradeCalc || [];
    const availableCategories =
      gradeCalcs.length > 0
        ? gradeCalcs.map((c) => c._Type)
        : Array.from(new Set(originalAssignments.map((a) => a._Type)));

    const defaultCategory = availableCategories[0] || "Assignment";
    const newId = `hypo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const today = new Date().toISOString().split("T")[0];

    const newAssignment: Assignment = {
      _Date: today,
      _DisplayScore: " / 100",
      _DropEndDate: "",
      _DropStartDate: "",
      _DueDate: today,
      _GradebookID: newId,
      _HasDropBox: "false",
      _Measure: "Hypothetical Assignment",
      _MeasureDescription: "",
      _Notes: "",
      _Point: "",
      _PointPossible: "100",
      _Points: " / 100",
      _Score: "",
      _ScoreCalValue: "",
      _ScoreMaxValue: "100",
      _ScoreType: "Raw Score",
      _StudentID: "",
      _TeacherID: "",
      _TimeSincePost: "Just now",
      _TotalSecondsSincePost: "0",
      _Type: defaultCategory,
      Resources: {},
      Standards: {},
    };

    setHypotheticalNewAssignments((prev) => [...prev, newAssignment]);
  }, [currentMark, originalAssignments]);

  const handleDeleteAssignment = React.useCallback((id: string) => {
    setHypotheticalNewAssignments((prev) =>
      prev.filter((a) => a._GradebookID !== id)
    );
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
  }, []);

  const handleResetAll = React.useCallback(() => {
    setHypotheticalScores({});
    setHypotheticalCategories({});
    setHypotheticalNewAssignments([]);
  }, []);

  const calcGrades = loadCalculateGradesEnabled();
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
                    ? `${Math.round(effectivePct)}%`
                    : "N/A"}
                </p>
              </div>
            </div>
            {!hideGradeCalcWarning &&
              !dontShowGradeCalcWarning &&
              !calcGrades &&
              !hasRubric &&
              !hypotheticalMode &&
              Number.isFinite(recalcTotals.pct) &&
              currentMark?._CalculatedScoreRaw &&
              Math.round(recalcTotals.pct) !==
                Math.round(
                  parseFloat(currentMark._CalculatedScoreRaw || "0"),
                ) && (
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
        <AssignmentsTable
          assignments={effectiveAssignments}
          getTypeColor={getAssignmentTypeColor}
          hypotheticalMode={hypotheticalMode}
          onToggleHypothetical={setHypotheticalMode}
          onEditScore={handleHypotheticalScoreChange}
          onEditCategory={handleHypotheticalCategoryChange}
          onCreateAssignment={handleCreateHypotheticalAssignment}
          onDeleteAssignment={handleDeleteAssignment}
          onResetAll={handleResetAll}
        />
      </div>
    </div>
  );
}

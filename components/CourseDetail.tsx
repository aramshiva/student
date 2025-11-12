"use client";

import {
  Course,
  Mark,
  Assignment,
  AssignmentGradeCalc,
} from "@/types/gradebook";
import {
  getGradeColor,
  getCourseIcon,
  numericToLetterGrade,
  parseWeightString,
  loadCalculateGradesEnabled,
} from "@/utils/gradebook";
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
  initialHypothetical?: boolean;
  onStateChange?: (sticky: boolean, hypothetical: boolean) => void;
}

export default function CourseDetail({
  course,
  onBack,
  initialSticky = false,
  initialHypothetical = false,
  onStateChange,
}: CourseDetailProps) {
  const marks = course.Marks.Mark;
  const currentMark = getCurrentMark(marks);
  const originalAssignments = React.useMemo(
    () => currentMark?.Assignments?.Assignment || [],
    [currentMark],
  );
  const [editableAssignments, setEditableAssignments] = React.useState<
    Assignment[]
  >(() => [...originalAssignments]);
  const [hypotheticalMode, setHypotheticalMode] =
    React.useState(initialHypothetical);

  const dontShowGradeCalcWarning = localStorage.getItem(
    "Student.dontShowGradeCalcWarning",
  );

  React.useEffect(() => {
    setEditableAssignments([...originalAssignments]);
  }, [course, currentMark, originalAssignments]);

  const workingAssignments = hypotheticalMode
    ? editableAssignments
    : originalAssignments;

  const isRubric = React.useCallback(
    (a: Assignment | undefined | null) =>
      !!a && /rubric/i.test(a._ScoreType || ""),
    [],
  );

  const extractScoreMax = React.useCallback(
    (a: Assignment): { score: number | null; max: number | null } => {
      const parsePoints = (pointsStr: string | undefined) => {
        if (!pointsStr) return null;
        const cleaned = pointsStr.replace(/of/i, "/");
        const m = cleaned.match(
          /([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)/,
        );
        if (!m) return null;
        return { e: parseFloat(m[1]), p: parseFloat(m[2]) };
      };

      const rubric = isRubric(a);
      let score: number | null = null;
      let max: number | null = null;

      const s = a._Score ? parseFloat(a._Score) : NaN;
      const rawMax = a._ScoreMaxValue
        ? parseFloat(a._ScoreMaxValue)
        : a._PointPossible
          ? parseFloat(a._PointPossible)
          : NaN;

      const deriveRubricMax = (): number => {
        const type = (a._ScoreType || "").toLowerCase();
        const explicit = type.match(/(\d+)\s*point/);
        if (explicit) {
          const n = parseInt(explicit[1], 10);
          if (n > 0 && n <= 20) return n;
        }
        const parsedPts = parsePoints(a._Points);
        if (parsedPts && parsedPts.p > 0 && parsedPts.p <= 20) {
          return parsedPts.p === 100 ? 4 : parsedPts.p;
        }
        if (
          Number.isFinite(rawMax) &&
          rawMax > 0 &&
          rawMax <= 10 &&
          rawMax !== 100
        ) {
          return rawMax;
        }
        return 4;
      };

      let mVal = rawMax;
      if (rubric) {
        mVal = deriveRubricMax();
      }

      if (Number.isFinite(s) && Number.isFinite(mVal)) {
        score = s;
        max = mVal;
      } else {
        const parsed = parsePoints(a._Points);
        if (parsed) {
          score = parsed.e;
          if (rubric) {
            max = deriveRubricMax();
          } else {
            max = parsed.p;
          }
        }
      }

      if (rubric && max === 100) {
        max = deriveRubricMax();
      }

      return { score, max };
    },
    [isRubric],
  );

  const recalcTotals = React.useMemo(() => {
    const gradeCalcs =
      currentMark?.GradeCalculationSummary?.AssignmentGradeCalc;

    if (gradeCalcs && gradeCalcs.length > 0) {
      const byType: Record<
        string,
        { points: number; possible: number; weight: string }
      > = {};

      gradeCalcs.forEach((calc) => {
        if (calc._Type && calc._Type.toUpperCase() !== "TOTAL") {
          byType[calc._Type] = {
            points: 0,
            possible: 0,
            weight: calc._Weight || "0%",
          };
        }
      });

      workingAssignments.forEach((a) => {
        const type = a._Type || "Other";
        const { score, max } = extractScoreMax(a);
        if (
          score !== null &&
          max !== null &&
          Number.isFinite(score) &&
          Number.isFinite(max) &&
          max > 0
        ) {
          if (!byType[type]) {
            byType[type] = { points: 0, possible: 0, weight: "0%" };
          }
          byType[type].points += score;
          byType[type].possible += max;
        }
      });

      const activeWeightSum = Object.values(byType).reduce((acc, v) => {
        return v.possible > 0 ? acc + parseWeightString(v.weight) : acc;
      }, 0);

      let weightedTotal = 0;
      if (activeWeightSum > 0) {
        Object.values(byType).forEach((v) => {
          if (v.possible > 0) {
            const categoryPct = (v.points / v.possible) * 100;
            const weightNum = parseWeightString(v.weight);
            weightedTotal += (categoryPct * weightNum) / activeWeightSum;
          }
        });
      }

      const totalEarned = Object.values(byType).reduce(
        (acc, v) => acc + v.points,
        0,
      );
      const totalPossible = Object.values(byType).reduce(
        (acc, v) => acc + v.possible,
        0,
      );

      return {
        earned: totalEarned,
        possible: totalPossible,
        pct: Number.isFinite(weightedTotal) ? weightedTotal : NaN,
      };
    }

    let earned = 0;
    let possible = 0;
    workingAssignments.forEach((a) => {
      const { score, max } = extractScoreMax(a);
      if (
        score !== null &&
        max !== null &&
        Number.isFinite(score) &&
        Number.isFinite(max) &&
        max > 0
      ) {
        earned += score;
        possible += max;
      }
    });
    const pct = possible > 0 ? (earned / possible) * 100 : NaN;
    return { earned, possible, pct };
  }, [workingAssignments, extractScoreMax, currentMark]);

  const hasRubric = React.useMemo(
    () => workingAssignments.some((a) => isRubric(a)),
    [workingAssignments, isRubric],
  );

  const simulatedLetter = numericToLetterGrade(Math.round(recalcTotals.pct));
  const calcGrades = loadCalculateGradesEnabled();
  let effectiveLetter: string | undefined = currentMark?._CalculatedScoreString;
  let effectivePct: number | undefined = currentMark?._CalculatedScoreRaw
    ? parseFloat(currentMark._CalculatedScoreRaw)
    : undefined;
  if (hypotheticalMode) {
    effectivePct = Number.isFinite(recalcTotals.pct)
      ? recalcTotals.pct
      : effectivePct;
    effectiveLetter = simulatedLetter || effectiveLetter;
  } else if (calcGrades) {
    if (Number.isFinite(recalcTotals.pct)) {
      effectivePct = recalcTotals.pct;
      effectiveLetter = numericToLetterGrade(Math.round(recalcTotals.pct));
    }
  } else if (hasRubric) {
    if (Number.isFinite(recalcTotals.pct)) {
      effectivePct = recalcTotals.pct;
      effectiveLetter = numericToLetterGrade(Math.round(recalcTotals.pct));
    }
  }
  const gradeColorClass = getGradeColor(
    hypotheticalMode ? simulatedLetter || "" : effectiveLetter || "",
  );

  const recalculatedBreakdown: AssignmentGradeCalc[] | null =
    React.useMemo(() => {
      if (
        !hypotheticalMode ||
        !currentMark?.GradeCalculationSummary?.AssignmentGradeCalc
      )
        return null;
      const originals = currentMark.GradeCalculationSummary.AssignmentGradeCalc;
      const byType: Record<
        string,
        { points: number; possible: number; weight: string }
      > = {};
      originals.forEach((o) => {
        byType[o._Type] = { points: 0, possible: 0, weight: o._Weight };
      });
      workingAssignments.forEach((a) => {
        const type = a._Type || "Other";
        const { score, max } = extractScoreMax(a);
        if (
          score === null ||
          max === null ||
          !Number.isFinite(score) ||
          !Number.isFinite(max) ||
          max <= 0
        )
          return;
        if (!byType[type]) {
          const original = originals.find((o) => o._Type === type);
          byType[type] = {
            points: 0,
            possible: 0,
            weight: original?._Weight || "0%",
          };
        }
        byType[type].points += score;
        byType[type].possible += max;
      });
      const rows = Object.entries(byType).map(([type, v]) => {
        const pct = v.possible > 0 ? (v.points / v.possible) * 100 : NaN;
        const weightNum = parseWeightString(v.weight);
        const weightedPct = Number.isFinite(pct) ? (pct * weightNum) / 100 : 0;
        const mark = Number.isFinite(pct)
          ? numericToLetterGrade(Math.round(pct))
          : "Not graded";
        return {
          _Type: type,
          _Points: v.points.toFixed(1),
          _PointsPossible: v.possible.toFixed(1),
          _Weight: v.weight,
          _CalculatedMark: mark,
          _WeightedPct: Number.isFinite(pct)
            ? `${weightedPct.toFixed(1)}%`
            : "—",
        } as AssignmentGradeCalc;
      });
      return rows.filter((r) => r._Type.toUpperCase() !== "TOTAL");
    }, [workingAssignments, currentMark, hypotheticalMode, extractScoreMax]);

  const availableTypes = React.useMemo(() => {
    const gradeCalcs =
      hypotheticalMode && recalculatedBreakdown
        ? recalculatedBreakdown
        : currentMark?.GradeCalculationSummary?.AssignmentGradeCalc;

    if (!gradeCalcs) return [];

    return gradeCalcs
      .map((calc) => calc._Type?.trim())
      .filter((type): type is string => Boolean(type && type.length > 0))
      .filter((type) => type.toUpperCase() !== "TOTAL");
  }, [hypotheticalMode, recalculatedBreakdown, currentMark]);

  const onUpdateAssignmentScore = React.useCallback(
    (id: string, score: string, max: string) => {
      setEditableAssignments((prev) =>
        prev.map((a) =>
          a._GradebookID === id
            ? {
                ...a,
                _Score: score,
                _ScoreMaxValue: max,
                _Points:
                  score && max && Number(max) > 0
                    ? `${score} / ${max}`
                    : a._Points,
              }
            : a,
        ),
      );
    },
    [],
  );

  const onEditAssignmentType = React.useCallback(
    (id: string, newType: string) => {
      setEditableAssignments((prev) =>
        prev.map((a) => (a._GradebookID === id ? { ...a, _Type: newType } : a)),
      );
    },
    [],
  );

  const onEditAssignmentName = React.useCallback((id: string, name: string) => {
    setEditableAssignments((prev) =>
      prev.map((a) => (a._GradebookID === id ? { ...a, _Measure: name } : a)),
    );
  }, []);

  const onCreateHypothetical = React.useCallback(() => {
    const newId = "hypo-" + Date.now().toString(36);
    const defaultType = editableAssignments[0]?._Type || "Homework";
    const newAssignment: Assignment = {
      _Date: new Date().toISOString(),
      _DisplayScore: "",
      _DropEndDate: "",
      _DropStartDate: "",
      _DueDate: new Date().toISOString(),
      _GradebookID: newId,
      _HasDropBox: "false",
      _Measure: "Untitled Assignment",
      _MeasureDescription: "Hypothetical Assignment",
      _Notes: "",
      _Point: "",
      _PointPossible: "",
      _Points: "",
      _Score: "",
      _ScoreCalValue: "",
      _ScoreMaxValue: "",
      _ScoreType: "Score",
      _StudentID: "",
      _TeacherID: "",
      _TimeSincePost: "0",
      _TotalSecondsSincePost: "0",
      _Type: defaultType,
      Resources: {},
      Standards: {},
    };
    setEditableAssignments((prev) => [newAssignment, ...prev]);
    if (!hypotheticalMode) setHypotheticalMode(true);
  }, [editableAssignments, hypotheticalMode]);
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
    return "bg-gray-100 text-gray-800";
  };

  const [chartSticky, setChartSticky] = React.useState(initialSticky);

  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (onStateChange) {
      onStateChange(chartSticky, hypotheticalMode);
    }
  }, [chartSticky, hypotheticalMode, onStateChange]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="bg-white dark:bg-neutral-950 shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <button
              onClick={onBack}
              className="mb-4 flex items-center text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
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
                      <p className="text-gray-500 text-sm">
                        {course._CourseID} • Period {course._Period} • Room{" "}
                        {course._Room}
                      </p>
                      <p className="text-gray-500 text-sm">
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
                  {hypotheticalMode
                    ? simulatedLetter ||
                      currentMark?._CalculatedScoreString ||
                      "N/A"
                    : effectiveLetter || "N/A"}
                </div>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  {hypotheticalMode
                    ? Number.isFinite(recalcTotals.pct)
                      ? `${Math.round(recalcTotals.pct)}%`
                      : "N/A"
                    : effectivePct != null && Number.isFinite(effectivePct)
                      ? `${Math.round(effectivePct)}%`
                      : "N/A"}
                </p>
              </div>
            </div>
            {!dontShowGradeCalcWarning &&
              !hypotheticalMode &&
              !calcGrades &&
              !hasRubric &&
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
                  assignments={workingAssignments}
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
            assignments={workingAssignments}
            sticky={chartSticky}
            onStickyChange={setChartSticky}
          />
        )}
        {hypotheticalMode && recalculatedBreakdown ? (
          <GradeBreakdown calcs={recalculatedBreakdown} />
        ) : (
          currentMark?.GradeCalculationSummary?.AssignmentGradeCalc && (
            <GradeBreakdown
              calcs={currentMark.GradeCalculationSummary.AssignmentGradeCalc}
            />
          )
        )}
        <AssignmentsTable
          assignments={workingAssignments}
          getTypeColor={getAssignmentTypeColor}
          onEditScore={onUpdateAssignmentScore}
          hypotheticalMode={hypotheticalMode}
          onToggleHypothetical={setHypotheticalMode}
          onEditType={onEditAssignmentType}
          onEditName={onEditAssignmentName}
          onCreateHypothetical={onCreateHypothetical}
          onDeleteHypothetical={(id) => {
            setEditableAssignments((prev) =>
              prev.filter((a) => a._GradebookID !== id),
            );
          }}
          availableTypes={availableTypes}
        />
      </div>
    </div>
  );
}

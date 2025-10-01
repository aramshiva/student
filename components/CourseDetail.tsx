"use client";

import { Course, Mark, Assignment, AssignmentGradeCalc } from "@/types/gradebook";
import { getGradeColor, getCourseIcon, numericToLetterGrade, parseWeightString } from "@/utils/gradebook";
import * as React from "react";
import { GradeChart } from "@/components/GradeChart";
import { GradeBreakdown } from "@/components/GradeBreakdown";
import { AssignmentsTable } from "@/components/AssignmentsTable";

function getCurrentMark(marks: Mark | Mark[]): Mark | null {
  if (Array.isArray(marks)) {
    return marks[marks.length - 1] || null;
  }
  return marks;
}

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
}

export default function CourseDetail({ course, onBack }: CourseDetailProps) {
  const marks = course.Marks.Mark;
  const currentMark = getCurrentMark(marks);
  const originalAssignments = React.useMemo(() => (
    currentMark?.Assignments?.Assignment || []
  ), [currentMark]);
  const [editableAssignments, setEditableAssignments] = React.useState<Assignment[]>(() => [...originalAssignments]);
  const [hypotheticalMode, setHypotheticalMode] = React.useState(false);

  React.useEffect(() => {
    setEditableAssignments([...originalAssignments]);
  }, [course, currentMark, originalAssignments]);

  const workingAssignments = hypotheticalMode ? editableAssignments : originalAssignments;

  const recalcTotals = React.useMemo(() => {
    let earned = 0;
    let possible = 0;
    workingAssignments.forEach(a => {
      const score = a._Score ? parseFloat(a._Score) : NaN;
      const max = a._ScoreMaxValue ? parseFloat(a._ScoreMaxValue) : (a._PointPossible ? parseFloat(a._PointPossible) : NaN);
      if (Number.isFinite(score) && Number.isFinite(max) && max > 0) {
        earned += score;
        possible += max;
      }
    });
    const pct = possible > 0 ? (earned / possible) * 100 : NaN;
    return { earned, possible, pct };
  }, [workingAssignments]);

  const simulatedLetter = numericToLetterGrade(Math.round(recalcTotals.pct));
  const gradeColorClass = getGradeColor(hypotheticalMode ? (simulatedLetter || "") : (currentMark?._CalculatedScoreString || ""));

  const recalculatedBreakdown: AssignmentGradeCalc[] | null = React.useMemo(() => {
    if (!hypotheticalMode || !currentMark?.GradeCalculationSummary?.AssignmentGradeCalc) return null;
    const originals = currentMark.GradeCalculationSummary.AssignmentGradeCalc;
    const byType: Record<string, { points: number; possible: number; weight: string }> = {};
    originals.forEach(o => {
      byType[o._Type] = { points: 0, possible: 0, weight: o._Weight };
    });
    workingAssignments.forEach(a => {
      const type = a._Type || 'Other';
      const score = a._Score ? parseFloat(a._Score) : NaN;
      const max = a._ScoreMaxValue ? parseFloat(a._ScoreMaxValue) : (a._PointPossible ? parseFloat(a._PointPossible) : NaN);
      if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0) return;
      if (!byType[type]) {
        const original = originals.find(o => o._Type === type);
        byType[type] = { points: 0, possible: 0, weight: original?._Weight || '0%' };
      }
      byType[type].points += score;
      byType[type].possible += max;
    });
    const weightSum = Object.values(byType).reduce((acc, v) => acc + parseWeightString(v.weight), 0) || 1;
    const rows = Object.entries(byType).map(([type, v]) => {
      const pct = v.possible > 0 ? (v.points / v.possible) * 100 : NaN;
      const weightNum = parseWeightString(v.weight);
      const weightedPct = Number.isFinite(pct) ? (pct * weightNum) / weightSum : 0;
      const mark = Number.isFinite(pct) ? numericToLetterGrade(Math.round(pct)) : 'Not graded';
      return {
        _Type: type,
        _Points: v.points.toFixed(1),
        _PointsPossible: v.possible.toFixed(1),
        _Weight: v.weight,
        _CalculatedMark: mark,
        _WeightedPct: Number.isFinite(pct) ? `${weightedPct.toFixed(1)}%` : '—',
      } as AssignmentGradeCalc;
    });
    return rows.filter(r => r._Type.toUpperCase() !== 'TOTAL');
  }, [workingAssignments, currentMark, hypotheticalMode]);

  const onUpdateAssignmentScore = React.useCallback((id: string, score: string, max: string) => {
    setEditableAssignments(prev => prev.map(a => a._GradebookID === id ? { ...a, _Score: score, _ScoreMaxValue: max } : a));
  }, []);

  const onEditAssignmentType = React.useCallback((id: string, newType: string) => {
    setEditableAssignments(prev => prev.map(a => a._GradebookID === id ? { ...a, _Type: newType } : a));
  }, []);

  const onEditAssignmentName = React.useCallback((id: string, name: string) => {
    setEditableAssignments(prev => prev.map(a => a._GradebookID === id ? { ...a, _Measure: name } : a));
  }, []);

  const onCreateHypothetical = React.useCallback(() => {
    const newId = 'hypo-' + Date.now().toString(36);
    const defaultType = (editableAssignments[0]?._Type) || 'Homework';
    const newAssignment: Assignment = {
      _Date: new Date().toISOString(),
      _DisplayScore: '',
      _DropEndDate: '',
      _DropStartDate: '',
      _DueDate: new Date().toISOString(),
      _GradebookID: newId,
      _HasDropBox: 'false',
      _Measure: 'Untitled Assignment',
      _MeasureDescription: 'Hypothetical Assignment created in hypothetical mode',
      _Notes: '',
      _Point: '',
      _PointPossible: '',
      _Points: '',
      _Score: '',
      _ScoreCalValue: '',
      _ScoreMaxValue: '',
      _ScoreType: 'Score',
      _StudentID: '',
      _TeacherID: '',
      _TimeSincePost: '0',
      _TotalSecondsSincePost: '0',
      _Type: defaultType,
      Resources: {},
      Standards: {},
    };
    setEditableAssignments(prev => [newAssignment, ...prev]);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <button
              onClick={onBack}
              className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </button>

            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{icon}</span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {course._CourseName}
                  </h1>
                  <p className="text-gray-600">
                    {course._CourseID} • Period {course._Period} • Room{" "}
                    {course._Room}
                  </p>
                  <p className="text-gray-600">
                    {course._Staff} • {course._StaffEMail}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className={`inline-flex px-4 py-2 rounded-lg text-lg font-bold ${gradeColorClass}`}>
                  {hypotheticalMode ? (simulatedLetter || currentMark?._CalculatedScoreString || "N/A") : (currentMark?._CalculatedScoreString || "N/A")}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {hypotheticalMode ? (Number.isFinite(recalcTotals.pct) ? `${Math.round(recalcTotals.pct)}%` : 'N/A') : (currentMark?._CalculatedScoreRaw || 'N/A') + '%'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <GradeChart assignments={workingAssignments} />
        {hypotheticalMode && recalculatedBreakdown ? (
          <GradeBreakdown calcs={recalculatedBreakdown} />
        ) : (currentMark?.GradeCalculationSummary?.AssignmentGradeCalc && (
          <GradeBreakdown calcs={currentMark.GradeCalculationSummary.AssignmentGradeCalc} />
        ))}
        <AssignmentsTable
          assignments={workingAssignments}
          getTypeColor={getAssignmentTypeColor}
          onEditScore={onUpdateAssignmentScore}
          hypotheticalMode={hypotheticalMode}
          onToggleHypothetical={setHypotheticalMode}
          onEditType={onEditAssignmentType}
          onEditName={onEditAssignmentName}
          onCreateHypothetical={onCreateHypothetical}
        />
      </div>
    </div>
  );
}

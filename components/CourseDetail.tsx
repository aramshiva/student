"use client";

import { Course, Mark } from "@/types/gradebook";
import { getGradeColor, getCourseIcon } from "@/utils/gradebook";
import * as React from "react";
import { GradeProgressionChart } from "@/components/GradeProgressionChart";
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
  const assignments = currentMark?.Assignments?.Assignment || [];
  const gradeColorClass = getGradeColor(
    currentMark?._CalculatedScoreString || "",
  );
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
                <div
                  className={`inline-flex px-4 py-2 rounded-lg text-lg font-bold ${gradeColorClass}`}
                >
                  {currentMark?._CalculatedScoreString || "N/A"}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {currentMark?._CalculatedScoreRaw || "N/A"}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <GradeProgressionChart assignments={assignments} />
        {currentMark?.GradeCalculationSummary?.AssignmentGradeCalc && (
          <GradeBreakdown
            calcs={currentMark.GradeCalculationSummary.AssignmentGradeCalc}
          />
        )}
        <AssignmentsTable
          assignments={assignments}
          getTypeColor={getAssignmentTypeColor}
        />
      </div>
    </div>
  );
}

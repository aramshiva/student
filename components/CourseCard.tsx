"use client";

import { Course, Mark, AssignmentGradeCalc } from "@/types/gradebook";
import { getGradeColor, getCourseIcon } from "@/utils/gradebook";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function getCurrentMark(marks: Mark | Mark[]): Mark | null {
  if (Array.isArray(marks)) {
    return marks[marks.length - 1] || null;
  }
  return marks;
}

interface CourseCardProps {
  course: Course;
  onClick: () => void;
}

export default function CourseCard({ course, onClick }: CourseCardProps) {
  const marks = course.Marks.Mark;
  const currentMark = getCurrentMark(marks);
  const gradeColorClass = getGradeColor(currentMark?.["@CalculatedScoreString"] || "");
  const icon = getCourseIcon(course["@ImageType"]);

  return (
    <Card onClick={onClick} className="cursor-pointer">
        <CardHeader>
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                        <CardTitle className="text-lg leading-tight">
                            {course["@CourseName"]}
                        </CardTitle>
                        <CardDescription>
                            {course["@CourseID"]} • Period {course["@Period"]} • Room {course["@Room"]}
                        </CardDescription>
                    </div>
                </div>
                <CardAction>
                    <div className={`px-3 py-1 rounded-lg text-2xl font-bold ${gradeColorClass}`}>
                        {currentMark?.["@CalculatedScoreString"] || "N/A"}
                    </div>
                </CardAction>
        </div>
    </CardHeader>
    <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Teacher:</span>
            <span className="text-sm font-medium text-gray-900">{course["@Staff"]}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Score:</span>
            <span className="text-sm font-bold text-gray-900">
              {currentMark?.["@CalculatedScoreRaw"] || "N/A"}%
            </span>
          </div>
        </div>

        {currentMark?.GradeCalculationSummary?.AssignmentGradeCalc && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Grade Breakdown
            </h4>
            <div className="space-y-1">
              {currentMark.GradeCalculationSummary.AssignmentGradeCalc.map((calc: AssignmentGradeCalc, index: number) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">
                    {calc["@Type"]} ({calc["@Weight"]})
                  </span>
                  <span className="font-medium">
                    {calc["@CalculatedMark"]} ({calc["@WeightedPct"]})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </CardContent>
    </Card>
  );
}

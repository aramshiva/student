"use client";

import { Course, Mark } from "@/types/gradebook";
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
  isLoading?: boolean;
}

export default function Dashboard({
  gradebookData,
  onCourseSelect,
  reportingPeriods = [],
  selectedReportingPeriod = null,
  onSelectReportingPeriod,
  isLoading = false,
}: DashboardProps) {
  const gbRoot = gradebookData.data.Gradebook ?? gradebookData.data;
  const courses: Course[] = gbRoot?.Courses?.Course || [];

  const validCourses = courses.filter((course: Course) => {
    const currentMark = getCurrentMark(course.Marks.Mark);
    const rawScore = Number(currentMark?._CalculatedScoreRaw) || 0;
    return rawScore > 0;
  });

  const totalPoints = validCourses.reduce((sum: number, course: Course) => {
    const currentMark = getCurrentMark(course.Marks.Mark);
    const rawScore = Number(currentMark?._CalculatedScoreRaw) || 0;
    let points = 0;

    if (rawScore >= 93) points = 4.0;
    else if (rawScore >= 90) points = 3.7;
    else if (rawScore >= 87) points = 3.3;
    else if (rawScore >= 83) points = 3.0;
    else if (rawScore >= 80) points = 2.7;
    else if (rawScore >= 77) points = 2.3;
    else if (rawScore >= 73) points = 2.0;
    else if (rawScore >= 70) points = 1.7;
    else if (rawScore >= 67) points = 1.3;
    else if (rawScore >= 60) points = 1.0;
    else points = 0;

    return sum + points;
  }, 0);

  const gpa =
    validCourses.length > 0
      ? (totalPoints / validCourses.length).toFixed(2)
      : "0.00";

  return (
    <>
      <div className="min-h-screen bg-white p-9">
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
                    <SelectValue className="text-xs" placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="p-1">
                    {reportingPeriods.map((rp) => (
                      <SelectItem
                        key={rp.index}
                        value={rp.index.toString()}
                      >
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
              <div className="text-sm text-gray-600">GPA</div>
              <div className="text-2xl font-bold">{gpa}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {courses.map((course: Course, index: number) => {
              const currentMark = getCurrentMark(course.Marks.Mark);
              const rawScore = Number(currentMark?._CalculatedScoreRaw) || 0;
              const calculatedScore =
                currentMark?._CalculatedScoreString || "N/A";

              return (
                <div
                  key={course._CourseID}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    index !== courses.length - 1
                      ? "border-b border-gray-200"
                      : ""
                  }`}
                  onClick={() => onCourseSelect(course)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-row space-x-5">
                      <span className="font-semibold text-gray-900 text-lg">
                        {course._Period}: {course._Title}
                      </span>
                      <span className="text-gray-600 text-sm mt-1">
                        {course._Staff} • Room {course._Room}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 pt-2">
                    <div className="text-3xl font-bold text-left">
                      {calculatedScore || "N/A"}
                    </div>
                    <div className="text-sm text-gray-600 text-left">
                      {rawScore > 0 ? `${rawScore.toFixed(1)}%` : "No grade"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

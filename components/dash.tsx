"use client";

import { GradebookData, Course, Mark } from "@/types/gradebook";
import Link from "next/link";

function getCurrentMark(marks: Mark | Mark[]): Mark | null {
  if (Array.isArray(marks)) {
    return marks[marks.length - 1] || null;
  }
  return marks;
}

interface DashboardProps {
  gradebookData: GradebookData;
  onCourseSelect: (course: Course) => void;
  onLogout: () => void;
}

export default function Dashboard({
  gradebookData,
  onCourseSelect,
}: DashboardProps) {
  const courses = gradebookData.data.Gradebook.Courses.Course;

  const validCourses = courses.filter((course) => {
    // this calculates courses with scores that are not 0, bc 0 most likely equals no score.
    // to do: make this toggleable
    const currentMark = getCurrentMark(course.Marks.Mark);
    const rawScore = currentMark?.["@CalculatedScoreRaw"] || 0;
    return rawScore > 0;
  });

  const totalPoints = validCourses.reduce((sum, course) => {
    const currentMark = getCurrentMark(course.Marks.Mark);
    const rawScore = currentMark?.["@CalculatedScoreRaw"] || 0;
    let points = 0;

    if (rawScore >= 93) points = 4.0; // todo: custom gpa support
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
      : "0.00"; // this one's simple, it's just the gpa.

  return (
    <>
      <div className="min-h-screen bg-white p-20">
        <div>
          <p>Gradebook</p>
          <p className="text-gray-600 mt-1">
            {new Date().getHours() < 12
              ? "Good Morning"
              : new Date().getHours() < 17
              ? "Good Afternoon"
              : "Good Evening"}{" "}
            NAME
          </p>
          <p className="text-gray-600 mt-1">
            {new Date().getHours() >= 1 && new Date().getHours() < 4 // if past 1am and before 4am
              ? "It's past 1am, go to sleep >:("
              : null}
          </p>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Current GPA</div>
              <div className="text-3xl font-bold text-black font-mono">
                {gpa}
              </div>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold">My courses</p>

          </div>
        </div>
      </div>
    </>
  );
}

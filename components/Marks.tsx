"use client";

import { Course, Mark } from "@/types/gradebook";
import {
  getGradeColor,
  numericToLetterGrade,
  loadCalculateGradesEnabled,
} from "@/utils/gradebook";

function getCurrentMark(marks: Mark | Mark[]): Mark | null {
  if (Array.isArray(marks)) return marks[marks.length - 1] || null;
  return marks;
}

interface MarksProps {
  courses: Course[];
}

export default function Marks({ courses }: MarksProps) {
  const calcGrades = loadCalculateGradesEnabled();

  const items = courses.map((course) => {
    const currentMark = getCurrentMark(course.Marks.Mark);
    const rawScore = currentMark?._CalculatedScoreRaw;
    const hasGrade = rawScore != null && rawScore !== "" && rawScore !== "0";
    const portalRaw = hasGrade ? Number(rawScore) : NaN;

    let localPct: number | null = null;
    if (calcGrades) {
      const assignments = currentMark?.Assignments?.Assignment || [];
      let earned = 0,
        possible = 0;
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
      if (possible > 0) localPct = (earned / possible) * 100;
    }

    const effectivePct = calcGrades && localPct != null ? localPct : portalRaw;
    const letter = Number.isFinite(effectivePct)
      ? numericToLetterGrade(Math.round(effectivePct))
      : currentMark?._CalculatedScoreString || "N/A";

    const displayLetter = calcGrades
      ? letter
      : currentMark?._CalculatedScoreString || "N/A";
    const displayPct = calcGrades
      ? localPct != null
        ? `${localPct.toFixed(1)}%`
        : null
      : portalRaw > 0
        ? `${portalRaw.toFixed(1)}%`
        : null;

    return {
      courseId: course._CourseID,
      period: course._Period,
      displayLetter,
      displayPct,
      numericPct:
        displayPct != null ? parseFloat(String(displayPct).replace("%", "")) : null,
    };
  });

  if (!items.length) return null;

  return (
    <div className="flex">
      {items.map((item) => (
        <div
          key={item.courseId}
          className="flex flex-col px-0.5 md:px-6 py-1 items-center flex-1"
        >
          <span className="text-xs font-medium text-zinc-400 pb-1">
            {item.period}
          </span>
          <span
            className={`text-base font-bold py-1.5 rounded-md w-full text-center ${getGradeColor(item.displayLetter)}`}
          >
            {item.displayLetter}
          </span>
          <span className="text-xs text-zinc-500 pt-1">
            {Math.floor(item.numericPct ?? 0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Course, Mark, Assignment } from "@/types/gradebook";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AssignmentEvent {
  assignment: Assignment;
  courseName: string;
  courseTitle: string;
  courseId: string;
  dueDate: Date;
}

function getCurrentMark(m: Mark | Mark[] | undefined): Mark | null {
  if (!m) return null;
  if (Array.isArray(m)) return m[m.length - 1] || null;
  return m;
}

export default function CalendarPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const inFlightRef = useRef(false);

  const fetchGradebook = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const creds = localStorage.getItem("Student.creds");
    if (!creds) {
      router.push("/login");
      return;
    }

    const credentials = JSON.parse(creds);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/synergy/gradebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data["@ErrorMessage"]) {
        throw new Error(data["@ErrorMessage"]);
      }

      const gbRoot = data?.Gradebook || data || {};
      const courses: Course[] = gbRoot?.Courses?.Course || [];

      const allAssignments: AssignmentEvent[] = [];

      for (const course of courses) {
        const currentMark = getCurrentMark(course?.Marks?.Mark);
        if (!currentMark) continue;

        const courseAssignments: Assignment[] =
          currentMark?.Assignments?.Assignment || [];

        for (const assignment of courseAssignments) {
          if (assignment._DueDate) {
            const dueDate = new Date(assignment._DueDate);
            if (!isNaN(dueDate.getTime())) {
              allAssignments.push({
                assignment,
                courseName: course._CourseName,
                courseTitle: course._Title,
                courseId: course._CourseID,
                dueDate,
              });
            }
          }
        }
      }

      allAssignments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      setAssignments(allAssignments);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    fetchGradebook();
  }, [fetchGradebook]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter(
      (a) =>
        a.dueDate.getDate() === date.getDate() &&
        a.dueDate.getMonth() === date.getMonth() &&
        a.dueDate.getFullYear() === date.getFullYear(),
    );
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-28 p-3"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );
      const dayAssignments = getAssignmentsForDate(date);
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`min-h-28 p-3 border border-zinc-200 dark:border-zinc-900 ${
            isToday ? "bg-zinc-100 dark:bg-zinc-900" : ""
          }`}
        >
          <div
            className={`text-sm font-medium mb-2 ${isToday ? "font-bold" : "text-zinc-600 dark:text-zinc-400"}`}
          >
            {day}
          </div>
          <div className="space-y-1.5">
            {dayAssignments.map((event, idx) => (
              <a
                key={idx}
                href={`/gradebook/${event.assignment._GradebookID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-all group relative cursor-pointer"
              >
                <div className="font-medium truncate text-black dark:text-white group-hover:invisible">
                  {event.courseTitle}
                </div>
                <div className="truncate text-zinc-500 dark:text-zinc-400 mt-0.5 group-hover:invisible">
                  {event.assignment._Measure}
                </div>
                <div className="hidden group-hover:block absolute z-10 left-0 top-0 w-max max-w-xs p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg">
                  <div className="font-medium text-black dark:text-white">
                    {event.courseTitle}
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {event.assignment._Measure}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>,
      );
    }

    return days;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-7 w-[200px]" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        <div className="rounded-lg overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-900">
          <div className="grid grid-cols-7 gap-0">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-semibold bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="min-h-28 p-3 border border-zinc-200 dark:border-zinc-900"
              >
                <Skeleton className="h-4 w-5 mb-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Skeleton className="h-6 w-[200px] mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-4 border border-zinc-200 dark:border-zinc-900 rounded-lg"
              >
                <Skeleton className="h-5 w-[60%] mb-2" />
                <Skeleton className="h-4 w-[40%]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-900">
        <div className="grid grid-cols-7 gap-0">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-semibold bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">{renderCalendar()}</div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Upcoming Assignments</h3>
        <div className="space-y-2">
          {assignments
            .filter((a) => a.dueDate >= new Date())
            .slice(0, 10)
            .map((event, idx) => (
              <button
                key={idx}
                onClick={() =>
                  router.push(`/gradebook/${event.assignment._GradebookID}`)
                }
                className="w-full p-4 border hover:cursor-pointer border-zinc-200 dark:border-zinc-900 rounded-lg hover:shadow-sm transition-shadow text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{event.courseTitle}</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {event.assignment._Measure}
                    </div>
                  </div>
                  <div className="text-sm text-zinc-500">
                    {event.dueDate.toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "./data-table";
import { courseColumns, type CourseHistoryRow } from "./columns";
import { GraduationChart } from "./graduation-chart";
interface Term {
  SchoolName: string;
  Year: string;
  TermName: string;
  TermOrder: number;
  Courses: Array<{
    CourseID: string;
    CourseTitle: string;
    CreditsAttempted: string;
    CreditsCompleted: string;
    VerifiedCredit: string;
    Mark: string;
    CHSType: string;
  }>;
}

interface GradeLevelData {
  Grade: string;
  GradeLevelOrder: number;
  Terms: Term[];
}

interface CourseHistoryResponse {
  graduationRequirements: Array<{
    subject: string;
    required: string;
    completed: string;
    inProgress: string;
    remaining: string;
    guid: string;
  }>;
  courseHistory: GradeLevelData[];
}

interface StudentCreds {
  district_url: string;
  username: string;
  password: string;
}

export default function HistoryPage() {
  const [data, setData] = useState<CourseHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const credsJson = localStorage.getItem("Student.creds");
        if (!credsJson) {
          throw new Error(
            "No credentials found in localStorage (Student.creds)",
          );
        }

        const creds: StudentCreds = JSON.parse(credsJson);
        const res = await fetch("/api/synergy/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            district_url: creds.district_url,
            username: creds.username,
            password: creds.password,
            timeout_ms: 15000,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`${res.status}: ${errText}`);
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Flatten course history into table rows with term separators
  const flattenCourseHistory = (courseHistory: GradeLevelData[]): CourseHistoryRow[] => {
    const rows: CourseHistoryRow[] = [];

    courseHistory.forEach((gradeLevel) => {
      gradeLevel.Terms.forEach((term) => {
        // Add term separator with school name
        rows.push({
          type: "term",
          schoolName: term.SchoolName,
          year: term.Year,
          termName: term.TermName,
        });

        // Add all courses for this term
        term.Courses.forEach((course) => {
          rows.push({
            type: "course",
            ...course,
          });
        });
      });
    });

    return rows;
  };

  return (
    <div>
      <div className="p-5 space-y-5">
        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-red-700">Error: {error}</p>
          </Card>
        )}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {data && (
          <>
            <Card className="p-5">
              <p className="text-lg">Graduation Requirements</p>
              <GraduationChart data={data.graduationRequirements} />
            </Card>
            <Card className="p-5">
              <p className="text-lg">Course History</p>
              <DataTable
                columns={courseColumns}
                data={flattenCourseHistory(data.courseHistory)}
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

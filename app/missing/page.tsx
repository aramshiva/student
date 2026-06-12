"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { PartyPopper } from "lucide-react";
import { Course, Mark, Assignment } from "@/types/gradebook";
import {
  formatDate,
  loadCacheDuration,
  loadGradebookCache,
  saveGradebookCache,
} from "@/utils/gradebook";
import { getStoredCredentials, synergyPost } from "@/lib/clientApi";

interface MissingGroup {
  courseId: string;
  courseName: string;
  assignments: Assignment[];
}

function getCurrentMark(m: Mark | Mark[] | undefined): Mark | null {
  if (!m) return null;
  if (Array.isArray(m)) return m[m.length - 1] || null;
  return m;
}

function isMissing(a: Assignment): boolean {
  return (a._Notes || "").trim().toLowerCase() === "missing";
}

function collectMissing(data: unknown): MissingGroup[] {
  const root = (data ?? {}) as {
    Gradebook?: { Courses?: { Course?: Course[] } };
    Courses?: { Course?: Course[] };
  };
  const gbRoot = root.Gradebook ?? root;
  const courses: Course[] = gbRoot?.Courses?.Course || [];
  const groups: MissingGroup[] = [];
  for (const course of courses) {
    const mark = getCurrentMark(course?.Marks?.Mark);
    const assignments: Assignment[] = mark?.Assignments?.Assignment || [];
    const missing = assignments.filter(isMissing);
    if (missing.length > 0) {
      groups.push({
        courseId: course._CourseID,
        courseName: course._CourseName,
        assignments: missing,
      });
    }
  }
  return groups;
}

export default function MissingPage() {
  const [groups, setGroups] = useState<MissingGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds = getStoredCredentials();
    if (!creds) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      try {
        const cacheDurationMs = loadCacheDuration() * 60 * 1000;
        const cached = loadGradebookCache(null);
        let data: unknown;
        if (
          cacheDurationMs > 0 &&
          cached &&
          Date.now() - cached.timestamp < cacheDurationMs
        ) {
          data = cached.data;
        } else {
          data = await synergyPost("/api/synergy/gradebook", creds);
          saveGradebookCache(null, data);
        }
        setGroups(collectMissing(data));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  if (!groups) {
    return (
      <div className="p-8 space-y-6 min-h-screen dark:bg-zinc-900">
        <Skeleton className="h-7 w-44" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const total = groups.reduce((acc, g) => acc + g.assignments.length, 0);

  return (
    <div className="p-8 space-y-6 min-h-screen dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Missing Work</h1>
        {total > 0 && <Badge variant="destructive">{total}</Badge>}
      </div>

      {total === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PartyPopper />
            </EmptyMedia>
            <EmptyTitle>Nothing missing</EmptyTitle>
            <EmptyDescription>
              No assignments are marked as missing. Nice work!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.courseId}>
              <CardHeader>
                <CardTitle className="text-base">
                  <Link
                    href={`/gradebook?course=${encodeURIComponent(g.courseId)}`}
                    className="hover:underline"
                  >
                    {g.courseName}
                  </Link>{" "}
                  <span className="text-sm font-normal text-zinc-500">
                    ({g.assignments.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.assignments.map((a) => (
                      <TableRow key={a._GradebookID}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(a._Date)}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/gradebook/${a._GradebookID}`}
                            className="font-medium hover:underline"
                          >
                            {a._Measure}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(a._Type || "").trim() || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {a._PointPossible || a._Points || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

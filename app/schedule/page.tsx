"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getStoredCredentials, synergyPost } from "@/lib/clientApi";
import type { ScheduleRoot } from "@/types/schedule";

interface Term {
  termIndex: number;
  termName: string;
  beginDate: string;
  endDate: string;
  codes: string[];
}

interface ScheduleEntry {
  period: number;
  courseTitle: string;
  room?: string;
  teacher?: string;
  teacherEmail?: string;
  startTime?: string;
  endTime?: string;
  excludePortal?: boolean;
}

export default function SchedulePage() {
  const [classes, setClasses] = useState<ScheduleEntry[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const TODAY_SENTINEL = -1;
  const [selectedTerm, setSelectedTerm] = useState<number>(TODAY_SENTINEL);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds = getStoredCredentials();
    if (!creds) {
      window.location.href = "/";
      return;
    }
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const raw = await synergyPost<ScheduleRoot>(
          "/api/synergy/schedule",
          creds,
          {
            term_index:
              selectedTerm === TODAY_SENTINEL ? undefined : selectedTerm,
          },
        );
        const root = raw?.StudentClassSchedule;
        if (!root) {
          setClasses([]);
          setTerms([]);
          return;
        }
        const termClasses = (root.ClassLists?.ClassListing ?? [])
          .map((c) => ({
            period: Number(c._Period || 0),
            courseTitle: c._CourseTitle,
            room: c._RoomName,
            teacher: c._Teacher,
            teacherEmail: c._TeacherEmail,
            excludePortal: (c._ExcludePVUE || "false").toLowerCase() === "true",
          }))
          .sort((a, b) => a.period - b.period);

        let classArr: ScheduleEntry[] = termClasses;
        if (selectedTerm === TODAY_SENTINEL) {
          const todayClasses = (
            root.TodayScheduleInfoData?.SchoolInfos?.SchoolInfo?.Classes
              ?.ClassInfo ?? []
          )
            .map((c) => ({
              period: Number(c._Period || 0),
              courseTitle: c._ClassName || "",
              room: c._RoomName || "",
              teacher: c._TeacherName || "",
              teacherEmail: c._TeacherEmail || "",
              startTime: c._StartTime,
              endTime: c._EndTime,
              excludePortal: false,
            }))
            .sort((a, b) => a.period - b.period);
          // the bell schedule is empty on non-school days and outside the
          // school year; fall back to the current term's classes
          if (todayClasses.length) classArr = todayClasses;
        }

        const termArr = (root.TermLists?.TermListing ?? [])
          .map((t) => ({
            termIndex: Number(t._TermIndex || 0),
            termName: t._TermName,
            beginDate: t._BeginDate,
            endDate: t._EndDate,
            codes: (t.TermDefCodes?.TermDefCode ?? []).map(
              (cd) => cd._TermDefName,
            ),
          }))
          .sort((a, b) => a.termIndex - b.termIndex);
        setTerms(termArr);
        setClasses(classArr);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedTerm, TODAY_SENTINEL]);

  // only today's bell schedule carries start/end times
  const showTimes = classes.some((c) => c.startTime || c.endTime);

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 min-h-screen dark:bg-zinc-900">
      {(isLoading || terms.length > 0) && (
        <div className="mb-4 flex items-center">
          {isLoading ? (
            <Skeleton className="h-6 w-[50px] mr-2" />
          ) : (
            <label className="font-semibold mr-2">Term:</label>
          )}
          {isLoading ? (
            <Skeleton className="h-10 w-[260px]" />
          ) : (
            <Select
              value={selectedTerm.toString()}
              onValueChange={(val) => setSelectedTerm(Number(val))}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODAY_SENTINEL.toString()}>
                  Today ({new Date().toLocaleDateString()})
                </SelectItem>
                {terms.map((term) => (
                  <SelectItem
                    key={term.termIndex}
                    value={term.termIndex.toString()}
                  >
                    {term.termName} ({term.beginDate} - {term.endDate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
      {!isLoading && !classes.length ? (
        <div className="p-8">No schedule found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">
                {isLoading ? <Skeleton className="h-4 w-12" /> : "Period"}
              </TableHead>
              <TableHead>
                {isLoading ? <Skeleton className="h-4 w-20" /> : "Course"}
              </TableHead>
              {showTimes && <TableHead>Time</TableHead>}
              <TableHead>
                {isLoading ? <Skeleton className="h-4 w-16" /> : "Room"}
              </TableHead>
              <TableHead>
                {isLoading ? <Skeleton className="h-4 w-24" /> : "Teacher"}
              </TableHead>
              <TableHead>
                {isLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  "Teacher Email"
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                  </TableRow>
                ))
              : classes.map((c) => (
                  <TableRow key={c.period}>
                    <TableCell>{c.period}</TableCell>
                    <TableCell>{c.courseTitle}</TableCell>
                    {showTimes && (
                      <TableCell>
                        {c.startTime && c.endTime
                          ? `${c.startTime} - ${c.endTime}`
                          : c.startTime || ""}
                      </TableCell>
                    )}
                    <TableCell>{c.room}</TableCell>
                    <TableCell>{c.teacher}</TableCell>
                    <TableCell>{c.teacherEmail || ""}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

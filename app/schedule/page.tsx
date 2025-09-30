"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
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

interface APIRawClassListing {
  _Period: string;
  _CourseTitle: string;
  _RoomName?: string;
  _Teacher?: string;
  _TeacherEmail?: string;
  _SectionGU?: string;
  _TeacherStaffGU?: string;
  _ExcludePVUE?: string;
}

interface APIRawTermDefCode {
  _TermDefName: string;
}
interface APIRawTermListing {
  _TermIndex: string;
  _TermCode: string;
  _TermName: string;
  _BeginDate: string;
  _EndDate: string;
  TermDefCodes?: { TermDefCode: APIRawTermDefCode | APIRawTermDefCode[] };
}

interface APIRawStudentClassScheduleRoot {
  StudentClassSchedule: {
    ClassLists?: { ClassListing: APIRawClassListing | APIRawClassListing[] };
    TermLists?: { TermListing: APIRawTermListing | APIRawTermListing[] };
    _TermIndex?: string;
    _TermIndexName?: string;
    _ErrorMessage?: string;
    TodayScheduleInfoData?: {
      SchoolInfos?: {
        SchoolInfo?: {
          Classes?: { ClassInfo: TodayClassInfo | TodayClassInfo[] };
        };
      };
    };
  };
}

interface TodayClassInfo {
  _Period?: string;
  _ClassName?: string;
  _RoomName?: string;
  _TeacherName?: string;
  _TeacherEmail?: string;
}

interface Term {
  termIndex: number;
  termName: string;
  beginDate: string;
  endDate: string;
  codes: string[];
}

interface ClassListing {
  period: number;
  courseTitle: string;
  room?: string;
  teacher?: string;
  teacherEmail?: string;
  excludePortal?: boolean;
}

export default function SchedulePage() {
  const [classes, setClasses] = useState<ClassListing[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const TODAY_SENTINEL = -1;
  const [selectedTerm, setSelectedTerm] = useState<number>(TODAY_SENTINEL);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds = localStorage.getItem("studentvue-creds");
    if (!creds) {
      window.location.href = "/";
      return;
    }
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/synergy/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...JSON.parse(creds),
            term_index: selectedTerm === TODAY_SENTINEL ? undefined : selectedTerm,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw: APIRawStudentClassScheduleRoot = await res.json();
  const root = raw?.StudentClassSchedule;
        if (!root) {
          setClasses([]);
          setTerms([]);
          return;
        }
        const normalize = <T,>(v: T | T[] | undefined | null): T[] =>
          !v ? [] : Array.isArray(v) ? v : [v];
        let classArr: ClassListing[] = [];
        if (selectedTerm === TODAY_SENTINEL) {
          const todayClasses = normalize<TodayClassInfo>(
            root?.TodayScheduleInfoData?.SchoolInfos?.SchoolInfo?.Classes?.ClassInfo,
          );
            classArr = todayClasses
              .map((c) => ({
                period: Number(c._Period || 0),
                courseTitle: c._ClassName || '',
                room: c._RoomName || '',
                teacher: c._TeacherName || '',
                teacherEmail: c._TeacherEmail || '',
                excludePortal: false,
              }))
              .sort((a, b) => a.period - b.period);
        } else {
          classArr = normalize(root.ClassLists?.ClassListing)
            .map((c) => ({
              period: Number(c._Period || 0),
              courseTitle: c._CourseTitle,
              room: c._RoomName,
              teacher: c._Teacher,
              teacherEmail: c._TeacherEmail,
              excludePortal: (c._ExcludePVUE || "false").toLowerCase() === "true",
            }))
            .sort((a, b) => a.period - b.period);
        }
        const termArr = normalize(root.TermLists?.TermListing)
          .map((t) => ({
            termIndex: Number(t._TermIndex || 0),
            termName: t._TermName,
            beginDate: t._BeginDate,
            endDate: t._EndDate,
            codes: normalize(t.TermDefCodes?.TermDefCode).map(
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

  if (isLoading) return <div className="p-8">Loading schedule...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <p className="text-xl font-medium pb-3">Class Schedule</p>
      {terms.length > 0 && (
        <div className="mb-4">
          <label className="font-semibold mr-2">Term:</label>
          <Select
            value={selectedTerm.toString()}
            onValueChange={(val) => setSelectedTerm(Number(val))}
          >
            <SelectTrigger className="w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAY_SENTINEL.toString()}>Today ( {new Date().toLocaleDateString()} )</SelectItem>
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
        </div>
      )}
      {!classes.length ? (
        <div className="p-8">No schedule found.</div>
      ) : (
        <Table>
          <TableCaption>Your current class schedule.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Period</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Teacher Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((c) => (
              <TableRow key={c.period}>
                <TableCell>{c.period}</TableCell>
                <TableCell>{c.courseTitle}</TableCell>
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

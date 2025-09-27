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

interface Term {
  termIndex: number;
  termName: string;
  beginDate: string;
  endDate: string;
}

interface ClassListing {
  "@CourseTitle": string;
  "@Period": number | string;
  "@RoomName": string;
  "@Teacher": string;
  "@TeacherEmail"?: string;
  [key: string]: string | number | undefined;
}

export default function SchedulePage() {
  const [classes, setClasses] = useState<ClassListing[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds = localStorage.getItem("studentvue-creds");
    if (!creds) {
      window.location.href = "/";
      return;
    }
    fetch(`https://${process.env.NEXT_PUBLIC_APIVUE_SERVER_URL}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...JSON.parse(creds), term_index: selectedTerm }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const sched = data.data.StudentClassSchedule;
        const classList = sched.ClassLists?.ClassListing || [];
        setClasses(Array.isArray(classList) ? classList : [classList]);
        const termList = sched.TermLists?.TermListing || [];
        setTerms(
          (Array.isArray(termList) ? termList : [termList]).map((t) => ({
            termIndex: Number((t as { [key: string]: unknown })["@TermIndex"] as string),
            termName: (t as { [key: string]: unknown })["@TermName"] as string,
            beginDate: (t as { [key: string]: unknown })["@BeginDate"] as string,
            endDate: (t as { [key: string]: unknown })["@EndDate"] as string,
          }))
        );
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  }, [selectedTerm]);

  if (isLoading) return <div className="p-8">Loading schedule...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <p className="text-xl font-medium pb-3">Class Schedule</p>
      {terms.length > 1 && (
        <div className="mb-4">
          <label className="font-semibold mr-2">Term:</label>
          <Select
            value={selectedTerm.toString()}
            onValueChange={val => setSelectedTerm(Number(val))}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term: Term) => (
                <SelectItem key={term.termIndex} value={term.termIndex.toString()}>
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
            {classes.map((course: ClassListing, i: number) => (
              <TableRow key={i}>
                <TableCell>{course["@Period"]}</TableCell>
                <TableCell>{course["@CourseTitle"]}</TableCell>
                <TableCell>{course["@RoomName"]}</TableCell>
                <TableCell>{course["@Teacher"]}</TableCell>
                <TableCell>{course["@TeacherEmail"] || ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

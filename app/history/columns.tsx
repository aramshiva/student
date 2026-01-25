"use client";

import { ColumnDef } from "@tanstack/react-table";

export interface GraduationRequirement {
  subject: string;
  required: string;
  completed: string;
  inProgress: string;
  remaining: string;
  guid: string;
}

export interface Course {
  CourseID: string;
  CourseTitle: string;
  CreditsAttempted: string;
  CreditsCompleted: string;
  VerifiedCredit: string;
  Mark: string;
  CHSType: string;
}

export interface Term {
  SchoolName: string;
  Year: string;
  TermName: string;
  TermOrder: number;
  Courses: Course[];
}

export interface GradeLevel {
  Grade: string;
  GradeLevelOrder: number;
  Terms: Term[];
}

export type CourseHistoryRow =
  | { type: "blank" }
  | { type: "year"; year: string; grade: string }
  | { type: "term"; schoolName: string; year: string; termName: string }
  | ({ type: "course" } & Course);

export const graduationColumns: ColumnDef<GraduationRequirement>[] = [
  {
    accessorKey: "subject",
    header: "Subject",
  },
  {
    accessorKey: "required",
    header: "Required",
    cell: ({ row }) => (
      <div className="text-right">{row.getValue("required")}</div>
    ),
  },
  {
    accessorKey: "completed",
    header: "Completed",
    cell: ({ row }) => (
      <div className="text-right">{row.getValue("completed")}</div>
    ),
  },
  {
    accessorKey: "inProgress",
    header: "In Progress",
    cell: ({ row }) => (
      <div className="text-right">{row.getValue("inProgress")}</div>
    ),
  },
  {
    accessorKey: "remaining",
    header: "Remaining",
    cell: ({ row }) => (
      <div className="text-right">{row.getValue("remaining")}</div>
    ),
  },
];

export const courseColumns: ColumnDef<CourseHistoryRow>[] = [
  {
    id: "courseInfo",
    header: "Course",
    cell: ({ row }) => {
      const rowData = row.original;
      if (rowData.type === "blank") {
        return null;
      }
      if (rowData.type === "year") {
        return null;
      }
      if (rowData.type === "term") {
        return (
          <div className="font-medium text-zinc-900 col-span-full">
            {rowData.schoolName} Year: {rowData.year} Term: {rowData.termName}
          </div>
        );
      }
      const courseId = (row.original as Course).CourseID;
      const courseTitle = (row.original as Course).CourseTitle;
      return (
        <div>
          {courseTitle} ({courseId})
        </div>
      );
    },
  },
  {
    accessorKey: "Mark",
    header: "Mark",
    cell: ({ row }) => {
      const rowData = row.original;
      if (
        rowData.type === "blank" ||
        rowData.type === "year" ||
        rowData.type === "term"
      ) {
        return null;
      }
      const mark = row.getValue("Mark") as string;
      return <>{mark}</>;
    },
  },
  {
    accessorKey: "CreditsAttempted",
    header: "Credit Attempted",
    cell: ({ row }) => {
      const rowData = row.original;
      if (
        rowData.type === "blank" ||
        rowData.type === "year" ||
        rowData.type === "term"
      ) {
        return null;
      }
      return (
        <div className="text-right">{row.getValue("CreditsAttempted")}</div>
      );
    },
  },
  {
    accessorKey: "CreditsCompleted",
    header: "Credit Completed",
    cell: ({ row }) => {
      const rowData = row.original;
      if (
        rowData.type === "blank" ||
        rowData.type === "year" ||
        rowData.type === "term"
      ) {
        return null;
      }
      return (
        <div className="text-right">{row.getValue("CreditsCompleted")}</div>
      );
    },
  },
  {
    accessorKey: "CHSType",
    header: "CHS Type",
    cell: ({ row }) => {
      const rowData = row.original;
      if (
        rowData.type === "blank" ||
        rowData.type === "year" ||
        rowData.type === "term"
      ) {
        return null;
      }
      return row.getValue("CHSType");
    },
  },
];

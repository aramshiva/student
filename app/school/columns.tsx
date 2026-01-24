"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Staff = {
  _Name: string;
  _EMail: string;
  _Title: string;
  _Phone?: string;
  _Extn?: string;
  _StaffGU: string;
};

const formatPhone = (phone?: string, ext?: string) => {
  if (!phone && !ext) return "";
  if (phone && ext) return `${phone} ext. ${ext}`;
  return phone || ext || "";
};

export const columns: ColumnDef<Staff>[] = [
  {
    accessorKey: "_Name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original._Name}</span>
    ),
  },
  {
    accessorKey: "_Title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "_EMail",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const email = row.original._EMail || "";
      return email ? (
        <a className="hover:underline" href={`mailto:${email}`}>
          {email}
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "phone",
    accessorFn: (row) => formatPhone(row._Phone, row._Extn) || "",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Phone
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const phone = formatPhone(row.original._Phone, row.original._Extn);
      return phone ? (
        <a href={`tel:${phone}`} className="hover:underline">
          {phone}
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
];

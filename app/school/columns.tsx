"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Staff = {
  name: string;
  eMail: string;
  title: string;
  phone?: string;
  extn?: string;
  staffGU: string;
};

const formatPhone = (phone?: string, ext?: string) => {
  if (!phone && !ext) return "";
  if (phone && ext) return `${phone} ext. ${ext}`;
  return phone || ext || "";
};

export const columns: ColumnDef<Staff>[] = [
  {
    accessorKey: "name",
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
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "title",
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
    accessorKey: "eMail",
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
      const email = row.original.eMail || "";
      return email ? (
        <a className="hover:underline" href={`mailto:${email}`}>
          {email}
        </a>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    id: "phone",
    accessorFn: (row) => formatPhone(row.phone, row.extn) || "",
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
      const phone = formatPhone(row.original.phone, row.original.extn);
      return phone ? (
        <a href={`tel:${phone}`} className="hover:underline">
          {phone}
        </a>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
];

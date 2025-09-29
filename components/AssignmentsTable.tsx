/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Assignment } from "@/types/gradebook";
import { formatDate, calculatePercentage } from "@/utils/gradebook";
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "./ui/badge";

interface AssignmentsTableProps {
  assignments: Assignment[];
  getTypeColor: (type: string) => string;
}

export function AssignmentsTable({ assignments, getTypeColor }: AssignmentsTableProps) {
  const columns: ColumnDef<Assignment>[] = [
    {
      id: "measure",
      accessorFn: (row) => row._Measure,
      header: ({ column }: { column: unknown }) => (
        <Button
          variant="ghost"
          onClick={() => (column as any).toggleSorting((column as any).getIsSorted() === "asc")}
        >
          Assignment <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="max-w-[260px] md:max-w-[340px] xl:max-w-[420px] space-y-1 pl-5">
            <div className="font-medium text-gray-900 break-words whitespace-normal leading-snug">
              {a._Measure}
            </div>
            {a._MeasureDescription && (
              <div className="text-sm text-gray-500 break-words whitespace-normal leading-snug">
                {a._MeasureDescription}
              </div>
            )}
            {a._Notes && (
              <div className="text-sm text-blue-600 italic break-words whitespace-normal leading-snug">
                Note: {a._Notes}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "type",
  accessorFn: (row) => row._Type,
      header: "Type",
  cell: ({ row }) => (
        <Badge className={`${getTypeColor(row.original._Type)}`}>
          {row.original._Type}
        </Badge>
      ),
    },
    {
      id: "date",
  accessorFn: (row) => row._Date,
  header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      sortingFn: (a, b, columnId) => {
        const av = new Date(a.getValue<string>(columnId)).getTime();
        const bv = new Date(b.getValue<string>(columnId)).getTime();
        return av === bv ? 0 : av < bv ? -1 : 1;
      },
  cell: ({ row }) => (
        <span className="text-sm text-gray-900">
          {formatDate(row.original._Date)}
        </span>
      ),
    },
    {
      id: "score",
      header: "Score",
      enableSorting: false,
  cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {a._DisplayScore}
            </div>
            <div className="text-gray-500">{a._Points}</div>
          </div>
        );
      },
    },
    {
      id: "percentage",
      header: "Percentage",
      sortingFn: (a, b) => {
        const pctA = calculatePercentage(
          Number(a.original._Score),
          Number(a.original._ScoreMaxValue)
        );
        const pctB = calculatePercentage(
          Number(b.original._Score),
          Number(b.original._ScoreMaxValue)
        );
        return pctA === pctB ? 0 : pctA < pctB ? -1 : 1;
      },
  cell: ({ row }) => {
        const a = row.original;
        const pct = calculatePercentage(Number(a._Score), Number(a._ScoreMaxValue));
        return (
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  pct >= 90
                    ? "bg-green-500"
                    : pct >= 80
                    ? "bg-blue-500"
                    : pct >= 70
                    ? "bg-yellow-500"
                    : pct >= 60
                    ? "bg-orange-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
              {pct}%
            </span>
          </div>
        );
      },
    },
    {
      id: "dueDate",
  accessorFn: (row) => row._DueDate,
      header: "Due Date",
  cell: ({ row }) => (
        <span className="text-sm text-gray-900">
          {formatDate(row.original._DueDate)}
        </span>
      ),
    },
    {
      id: "notes",
  accessorFn: (row) => row._Notes,
      header: "Notes",
  cell: ({ row }) => (
        <span className="text-sm text-gray-900">
          {row.original._Notes}
        </span>
      ),
    },
  ];

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: assignments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getRowId: (row) => String(row._GradebookID),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignments ({assignments.length})</CardTitle>
        <CardDescription>List of all assignments</CardDescription>
        <CardAction>
          <Input
            placeholder="Filter assignments..."
            value={
              (table.getColumn("measure")?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn("measure")?.setFilterValue(e.target.value)
            }
            className="h-8"
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-sm text-gray-500"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-gray-500">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

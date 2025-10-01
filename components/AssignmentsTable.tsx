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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, Trash2 } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";

interface AssignmentsTableProps {
  assignments: Assignment[];
  getTypeColor: (type: string) => string;
  onEditScore?: (id: string, score: string, max: string) => void;
  hypotheticalMode?: boolean;
  onToggleHypothetical?: (val: boolean) => void;
  onEditType?: (id: string, newType: string) => void;
  onEditName?: (id: string, name: string) => void;
  onCreateHypothetical?: () => void;
  onDeleteHypothetical?: (id: string) => void;
}

function AssignmentsTableBase({
  assignments,
  getTypeColor,
  onEditScore,
  hypotheticalMode = false,
  onToggleHypothetical,
  onEditType,
  onEditName,
  onCreateHypothetical,
  onDeleteHypothetical,
}: AssignmentsTableProps) {
  const decodeEntities = React.useCallback(
    (input: string | undefined | null): string => {
      if (!input) return "";
      return input.replace(/&(#x?[0-9A-Fa-f]+|[A-Za-z]+);/g, (full, ent) => {
        if (ent.startsWith("#")) {
          const num =
            ent.startsWith("#x") || ent.startsWith("#X")
              ? parseInt(ent.slice(2), 16)
              : parseInt(ent.slice(1), 10);
          if (!isNaN(num)) {
            if (num === 10 || num === 13) return "\n";
            return String.fromCharCode(num);
          }
          return full;
        }
        const map: Record<string, string> = {
          amp: "&",
          lt: "<",
          gt: ">",
          quot: '"',
          apos: "'",
          nbsp: " ",
          nbspx: " ",
        };
        return map[ent] ?? full;
      });
    },
    [],
  );

  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());
  const toggleExpanded = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const SHOULD_TRUNCATE_THRESHOLD = 120;

  const [draftScores, setDraftScores] = React.useState<
    Record<string, { score: string; max: string }>
  >({});
  const [draftNames, setDraftNames] = React.useState<Record<string, string>>(
    {},
  );
  const debounceTimers = React.useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const DEBOUNCE_MS = 500;
  React.useEffect(() => {
    setDraftScores((prev) => {
      const next = { ...prev };
      assignments.forEach((a) => {
        const id = a._GradebookID;
        if (!next[id]) {
          next[id] = {
            score: a._Score ?? "",
            max: a._ScoreMaxValue ?? a._PointPossible ?? "",
          };
        }
      });
      return next;
    });
    setDraftNames((prev) => {
      const next: Record<string, string> = { ...prev };
      assignments.forEach((a) => {
        const id = a._GradebookID;
        if (next[id] == null) next[id] = a._Measure ?? "";
      });
      Object.keys(next).forEach((k) => {
        if (!assignments.some((a) => a._GradebookID === k)) delete next[k];
      });
      return next;
    });
  }, [assignments]);

  const flushUpdate = React.useCallback(
    (id: string) => {
      const data = draftScoresRef.current[id];
      if (!data) return;
      onEditScore?.(id, data.score, data.max);
    },
    [onEditScore],
  );

  const handleDraftChange = React.useCallback(
    (id: string, field: "score" | "max", value: string) => {
      setDraftScores((prev) => {
        const cur = prev[id] || { score: "", max: "" };
        const next = { ...prev, [id]: { ...cur, [field]: value } };
        return next;
      });
      if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);
      debounceTimers.current[id] = setTimeout(() => {
        flushUpdate(id);
      }, DEBOUNCE_MS);
    },
    [flushUpdate],
  );

  const draftScoresRef = React.useRef(draftScores);
  React.useEffect(() => {
    draftScoresRef.current = draftScores;
  }, [draftScores]);
  const draftNamesRef = React.useRef(draftNames);
  React.useEffect(() => {
    draftNamesRef.current = draftNames;
  }, [draftNames]);
  React.useEffect(() => {
    const timersSnapshot = { ...debounceTimers.current };
    return () => {
      Object.values(timersSnapshot).forEach((t) => clearTimeout(t));
      const snapshot = draftScoresRef.current;
      Object.keys(snapshot).forEach((id) => {
        const data = snapshot[id];
        if (data) onEditScore?.(id, data.score, data.max);
      });
    };
  }, [onEditScore]);

  const columns: ColumnDef<Assignment>[] = React.useMemo(
    () => [
      {
        id: "measure",
        accessorFn: (row) => row._Measure,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assignment <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const a = row.original;
          const originalMeasure = decodeEntities(a._Measure);
          const renamed = draftNames[a._GradebookID] ?? originalMeasure;
          const desc = a._MeasureDescription
            ? decodeEntities(a._MeasureDescription)
            : "";
          const id = String(a._GradebookID ?? row.id);
          const isExpanded = expanded.has(id);
          const shouldTruncate =
            !isExpanded && desc && desc.length > SHOULD_TRUNCATE_THRESHOLD;
          return (
            <div className="max-w-[16rem] md:max-w-[21rem] xl:max-w-[26rem] space-y-1 pl-5">
              {hypotheticalMode ? (
              <Input
                type="text"
                value={renamed}
                onChange={(e) => {
                    const value = e.target.value;
                    setDraftNames((prev) => ({
                      ...prev,
                      [a._GradebookID]: value,
                    }));
                    onEditName?.(a._GradebookID, value);
                  }}
                  placeholder="Assignment name"
                />
              ) : (
                <div className="font-medium text-black break-words whitespace-pre-line leading-snug">
                  {originalMeasure}
                </div>
              )}
              {desc && (
                <div className="relative group">
                  <div
                    className={
                      `text-sm text-gray-500 break-words whitespace-pre-line leading-snug transition-all` +
                      (shouldTruncate ? " line-clamp-2 overflow-hidden" : "")
                    }
                    style={
                      shouldTruncate
                        ? ({
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {desc}
                  </div>
                  {shouldTruncate && (
                    <div className="absolute bottom-0 right-0 flex items-end justify-end pl-4 text-xs bg-gradient-to-l from-white via-white/80 to-transparent h-6">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(id)}
                        className="px-1 py-0.5 rounded text-gray-500 hover:text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
                        aria-label="Expand full description"
                      >
                        …
                      </button>
                    </div>
                  )}
                  {desc &&
                    !shouldTruncate &&
                    desc.length > SHOULD_TRUNCATE_THRESHOLD && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(id)}
                        className="mt-1 text-xs text-blue-600 hover:underline focus:outline-none"
                        aria-label="Collapse description"
                      >
                        Collapse
                      </button>
                    )}
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
        cell: ({ row }) => {
          const uniqueTypes = Array.from(
            new Set(
              assignments
                .map((a) => (a._Type || "").trim())
                .filter((t) => t.length > 0),
            ),
          );
          const curType =
            row.original._Type && row.original._Type.trim().length > 0
              ? row.original._Type
              : uniqueTypes[0] || "";

          if (!hypotheticalMode || uniqueTypes.length < 2) {
            return (
              <Badge className={`${getTypeColor(curType || "Uncategorized")}`}>
                {curType || "Uncategorized"}
              </Badge>
            );
          }

          return (
            <Select
              value={curType}
              onValueChange={(val) =>
                onEditType?.(row.original._GradebookID, val)
              }
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {uniqueTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
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
          <span className="text-sm text-black">
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
          const id = a._GradebookID;
          const ds = draftScoresRef.current[id];
          const draft = ds || {
            score: a._Score ?? "",
            max: a._ScoreMaxValue ?? a._PointPossible ?? "",
          };
          if (!hypotheticalMode) {
            return (
              <div className="text-sm">
                <div className="font-medium text-black">
                  {a._DisplayScore}
                </div>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-1 text-sm w-[130px]">
              <Input
                type="number"
                className="w-16 p-1"
                defaultValue={draft.score}
                onChange={(e) => handleDraftChange(id, "score", e.target.value)}
                onBlur={() => flushUpdate(id)}
              />
              <span className="text-gray-500">/</span>
              <Input
                type="number"
                className="w-16 p-1"
                defaultValue={draft.max}
                onChange={(e) => handleDraftChange(id, "max", e.target.value)}
                onBlur={() => flushUpdate(id)}
              />
            </div>
          );
        },
      },
      {
        id: "percentage",
        header: "Percentage",
        sortingFn: (a, b) => {
          const pctFrom = (row: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const ra = row.original;
            const usePoints = hypotheticalMode && typeof ra._Points === 'string' && ra._Points.includes('/');
            let score = Number(ra._Score);
            let max = Number(ra._ScoreMaxValue);
            if (usePoints) {
              const cleaned = ra._Points.replace(/of/i, '/');
              const m = cleaned.match(/([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)/);
              if (m) {
                score = parseFloat(m[1]);
                max = parseFloat(m[2]);
              }
            }
            return calculatePercentage(score, max);
          };
          const pctA = pctFrom(a);
          const pctB = pctFrom(b);
          return pctA === pctB ? 0 : pctA < pctB ? -1 : 1;
        },
        cell: ({ row }) => {
          const a = row.original;
          const usePoints = hypotheticalMode && typeof a._Points === 'string' && a._Points.includes('/');
          let rawScore = Number(a._Score);
            let rawMax = Number(a._ScoreMaxValue);
          if (usePoints) {
            const cleaned = a._Points.replace(/of/i, '/');
            const m = cleaned.match(/([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)/);
            if (m) {
              rawScore = parseFloat(m[1]);
              rawMax = parseFloat(m[2]);
            }
          }
          const pct = calculatePercentage(rawScore, rawMax);
          const invalid = !Number.isFinite(rawScore) || !Number.isFinite(rawMax) || rawMax === 0 || Number.isNaN(pct);
          if (invalid) {
            return (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500" title="Not graded yet">Not graded</span>
              </div>
            );
          }
          return (
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2" aria-hidden="true">
                <div
                  className={`h-2 rounded-full ${
                    pct >= 90 ? 'bg-green-500' : pct >= 80 ? 'bg-blue-500' : pct >= 70 ? 'bg-yellow-500' : pct >= 60 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-black min-w-[3rem]">{pct}%</span>
            </div>
          );
        },
      },
      {
        id: "dueDate",
        accessorFn: (row) => row._DueDate,
        header: "Due Date",
        cell: ({ row }) => (
          <span className="text-sm text-black">
            {formatDate(row.original._DueDate)}
          </span>
        ),
      },
      {
        id: "notes",
        accessorFn: (row) => row._Notes,
        header: "Notes",
        cell: ({ row }) => {
          const decoded = decodeEntities(row.original._Notes);
          const lower = decoded.trim().toLowerCase();
          const isMissing = lower === "missing";
          return (
            <span className="text-sm text-black break-words whitespace-pre-line">
              {decoded}
              {isMissing && (
                <div
                  className={`text-sm ${
                    isMissing ? "text-red-600" : "text-blue-600"
                  } italic break-words whitespace-pre-line leading-snug`}
                >
                  Note: {decoded}
                </div>
              )}
            </span>
          );
        },
      },
      {
        id: "points",
        header: "Points",
        cell: ({ row }) => {
          const a = row.original;
          let display: string | null = null;
          const rawPts = typeof a._Points === 'string' ? a._Points.trim() : '';
          if (rawPts) {
            const normalized = rawPts.replace(/\s*\/\s*/g, ' / ').replace(/\s{2,}/g, ' ').trim();
            display = /\bpts?\b|\bpoints?\b/i.test(normalized) ? normalized : `${normalized}`;
          } else {
            const s = a._Score?.toString().trim();
            const m = (a._ScoreMaxValue || a._PointPossible || '').toString().trim();
            if (s && m) display = `${parseFloat(s).toFixed(2)} / ${parseFloat(m).toFixed(2)}`;
            else if (s) display = `${parseFloat(s).toFixed(2)}`;
          }
          if (!display) display = '—';
          return (
            <span className="text-sm text-black">
              {display}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const a = row.original;
          const isHypo = typeof a._GradebookID === 'string' && a._GradebookID.startsWith('hypo-');
          if (!hypotheticalMode || !isHypo) return null;
          return (
            <div className="flex justify-end pr-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDeleteHypothetical?.(a._GradebookID)}
                    aria-label="Delete hypothetical assignment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [
      decodeEntities,
      expanded,
      hypotheticalMode,
      getTypeColor,
      toggleExpanded,
      handleDraftChange,
      flushUpdate,
      draftNames,
      assignments,
      onEditType,
      onEditName,
      onDeleteHypothetical,
    ],
  );

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

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
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Checkbox
                    defaultChecked={hypotheticalMode}
                    onCheckedChange={(val) => {
                      const next =
                        val === "indeterminate" ? false : Boolean(val);
                      onToggleHypothetical?.(next);
                    }}
                  />
                  <p className="text-sm pr-2">Hypothetical Mode</p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-96">
                <p>
                  Hypothetical Mode is a powerful mode allowing you to see how
                  certain grades on assignments will affect your grade.
                </p>
              </TooltipContent>
            </Tooltip>
            {hypotheticalMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateHypothetical?.()}
              >
                Create Assignment
              </Button>
            )}
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
          </div>
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
                            header.getContext(),
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
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
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
      {table.getPageCount() > 1 && (
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-500">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
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
      )}
    </Card>
  );
}

export const AssignmentsTable = React.memo(AssignmentsTableBase);

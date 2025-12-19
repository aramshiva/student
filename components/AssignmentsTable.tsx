"use client";

import * as React from "react";
import { Assignment } from "@/types/gradebook";
import { formatDate } from "@/utils/gradebook";
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
  Row,
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
import { getGradeColor, numericToLetterGrade } from "@/utils/gradebook";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";

interface AssignmentsTableProps {
  assignments: Assignment[];
  getTypeColor: (type: string) => string;
  onEditScore?: (id: string, score: string, max: string) => void;
  onEditType?: (id: string, newType: string) => void;
  onEditName?: (id: string, name: string) => void;
  availableTypes?: string[];
  hypotheticalMode?: boolean;
  onToggleHypothetical?: (enabled: boolean) => void;
  onCreateAssignment?: () => void;
  onEditCategory?: (id: string, category: string) => void;
}

function ScoreEditor({
  assignmentId,
  draftScoresRef,
  setDraftScores,
  onEditScoreRef,
  debounceTimers,
}: {
  assignmentId: string;
  draftScoresRef: React.MutableRefObject<
    Record<string, { score: string; max: string }>
  >;
  setDraftScores: React.Dispatch<
    React.SetStateAction<Record<string, { score: string; max: string }>>
  >;
  onEditScoreRef: React.MutableRefObject<
    ((id: string, score: string, max: string) => void) | undefined
  >;
  debounceTimers: React.MutableRefObject<
    Record<string, ReturnType<typeof setTimeout>>
  >;
}) {
  const draft = draftScoresRef.current[assignmentId];

  if (!draft) return null;

  return (
    <div className="flex gap-1 items-center">
      <Input
        type="text"
        inputMode="decimal"
        pattern="[0-9]*\.?[0-9]*"
        defaultValue={draft.score}
        onChange={(e) => {
          const val = e.target.value;
          if (val !== "" && !/^[0-9]*\.?[0-9]*$/.test(val)) {
            return;
          }
          const currentMax =
            draftScoresRef.current[assignmentId]?.max || draft.max;
          setDraftScores((prev) => ({
            ...prev,
            [assignmentId]: { ...prev[assignmentId], score: val },
          }));

          if (debounceTimers.current[assignmentId]) {
            clearTimeout(debounceTimers.current[assignmentId]);
          }

          debounceTimers.current[assignmentId] = setTimeout(() => {
            onEditScoreRef.current?.(assignmentId, val, currentMax);
          }, 500);
        }}
        onFocus={() => {
          if (debounceTimers.current[assignmentId]) {
            clearTimeout(debounceTimers.current[assignmentId]);
          }
        }}
        className="h-7 w-16 text-xs"
      />
      <span className="text-xs text-zinc-500">/</span>
      <Input
        type="text"
        inputMode="decimal"
        pattern="[0-9]*\.?[0-9]*"
        defaultValue={draft.max}
        onChange={(e) => {
          const val = e.target.value;
          if (val !== "" && !/^[0-9]*\.?[0-9]*$/.test(val)) {
            return;
          }
          const currentScore =
            draftScoresRef.current[assignmentId]?.score || draft.score;
          setDraftScores((prev) => ({
            ...prev,
            [assignmentId]: { ...prev[assignmentId], max: val },
          }));

          if (debounceTimers.current[assignmentId]) {
            clearTimeout(debounceTimers.current[assignmentId]);
          }

          debounceTimers.current[assignmentId] = setTimeout(() => {
            onEditScoreRef.current?.(assignmentId, currentScore, val);
          }, 500);
        }}
        onFocus={() => {
          if (debounceTimers.current[assignmentId]) {
            clearTimeout(debounceTimers.current[assignmentId]);
          }
        }}
        className="h-7 w-16 text-xs"
      />
    </div>
  );
}

function CategoryEditor({
  assignmentId,
  currentCategory,
  availableCategories,
  onEditCategoryRef,
  getTypeColor,
}: {
  assignmentId: string;
  currentCategory: string;
  availableCategories: string[];
  onEditCategoryRef: React.MutableRefObject<
    ((id: string, category: string) => void) | undefined
  >;
  getTypeColor: (type: string) => string;
}) {
  const [value, setValue] = React.useState(currentCategory);

  return (
    <select
      value={value}
      onChange={(e) => {
        const newCat = e.target.value;
        setValue(newCat);
        onEditCategoryRef.current?.(assignmentId, newCat);
      }}
      className={`text-xs px-2 py-1 rounded-md border ${getTypeColor(value)}`}
    >
      {availableCategories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
}

function AssignmentsTableBase({
  assignments,
  getTypeColor,
  onEditScore,
  hypotheticalMode = false,
  onToggleHypothetical,
  onEditCategory,
  onCreateAssignment,
}: AssignmentsTableProps) {
  const availableCategories = React.useMemo(
    () =>
      Array.from(
        new Set(assignments.map((a) => a._Type).filter(Boolean)),
      ).sort(),
    [assignments],
  );
  const isRubric = React.useCallback(
    (a: Pick<Assignment, "_ScoreType"> | Assignment | undefined | null) =>
      !!a && /rubric/i.test(a._ScoreType || ""),
    [],
  );
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

  const [draftScores, setDraftScores] = React.useState<
    Record<string, { score: string; max: string }>
  >({});
  const [draftNames, setDraftNames] = React.useState<Record<string, string>>(
    {},
  );
  const debounceTimers = React.useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const onEditScoreRef = React.useRef(onEditScore);
  const onEditCategoryRef = React.useRef(onEditCategory);

  React.useEffect(() => {
    onEditScoreRef.current = onEditScore;
  }, [onEditScore]);

  React.useEffect(() => {
    onEditCategoryRef.current = onEditCategory;
  }, [onEditCategory]);
  React.useEffect(() => {
    setDraftScores((prev) => {
      const next = { ...prev };
      assignments.forEach((a) => {
        const id = a._GradebookID;
        if (!next[id]) {
          const derivedMax = isRubric(a)
            ? "4"
            : (a._ScoreMaxValue ?? a._PointPossible ?? "");
          next[id] = {
            score: a._Score ?? "",
            max: derivedMax,
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
  }, [assignments, isRubric]);

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

  const [expandedDesc, setExpandedDesc] = React.useState<
    Record<string, boolean>
  >({});

  const getScoreAndMax = React.useCallback(
    (a: Assignment): { score: number; max: number } | null => {
      const parseFraction = (
        s: string | undefined,
      ): { s: number; p: number } | null => {
        if (!s) return null;
        const cleaned = s.replace(/of/gi, "/").trim();
        const m = cleaned.match(/([0-9]*\.?[0-9]+)\s*\/\s*([0-9]*\.?[0-9]+)/);
        return m ? { s: parseFloat(m[1]), p: parseFloat(m[2]) } : null;
      };
      let score = a._Score ? parseFloat(a._Score) : NaN;
      let max = a._ScoreMaxValue
        ? parseFloat(a._ScoreMaxValue)
        : a._PointPossible
          ? parseFloat(a._PointPossible)
          : NaN;
      if (
        (!Number.isFinite(score) || !Number.isFinite(max)) &&
        a._DisplayScore
      ) {
        const frac = parseFraction(a._DisplayScore);
        if (frac) {
          score = frac.s;
          max = frac.p;
        }
      }
      if ((!Number.isFinite(score) || !Number.isFinite(max)) && a._Points) {
        const frac = parseFraction(a._Points);
        if (frac) {
          score = frac.s;
          max = frac.p;
        }
      }
      if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0)
        return null;
      return { score, max };
    },
    [],
  );

  const deltas = React.useMemo(() => {
    const chronological = [...assignments].sort(
      (a, b) => new Date(a._Date).getTime() - new Date(b._Date).getTime(),
    );
    let earned = 0;
    let possible = 0;
    let prevAvg = 0;
    const map: Record<string, number> = {};
    chronological.forEach((a) => {
      const parts = getScoreAndMax(a);
      if (!parts) {
        map[a._GradebookID] = NaN;
        return;
      }
      earned += parts.score;
      possible += parts.max;
      const newAvg = possible > 0 ? (earned / possible) * 100 : prevAvg;
      const delta = newAvg - prevAvg;
      map[a._GradebookID] = delta;
      prevAvg = newAvg;
    });
    return map;
  }, [assignments, getScoreAndMax]);

  const assignmentPercents = React.useMemo(() => {
    const map: Record<string, number> = {};
    assignments.forEach((a) => {
      const parts = getScoreAndMax(a);
      if (!parts) {
        map[a._GradebookID] = NaN;
      } else {
        map[a._GradebookID] =
          parts.max > 0 ? (parts.score / parts.max) * 100 : NaN;
      }
    });
    return map;
  }, [assignments, getScoreAndMax]);

  const columns: ColumnDef<Assignment>[] = React.useMemo(
    () => [
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
          <span className="text-sm text-black dark:text-white ">
            {formatDate(row.original._Date)}
          </span>
        ),
      },
      {
        id: "measure",
        accessorFn: (row) => row._Measure,
        header: "Assignment",
        cell: ({ row }) => {
          const a = row.original;
          const originalMeasure = decodeEntities(a._Measure);
          const desc = decodeEntities(a._MeasureDescription);
          const DESCRIPTION_TRUNCATE_LENGTH = 160; // character threshold for truncation
          const shouldTruncate =
            desc && desc.length > DESCRIPTION_TRUNCATE_LENGTH;
          const id = a._GradebookID;
          const isExpanded = expandedDesc[id];
          return (
            <div className="space-y-1">
              <div className="font-medium text-black dark:text-white break-words whitespace-pre-line leading-snug">
                {originalMeasure}
              </div>
              {desc && desc.trim().length > 0 ? (
                <div
                  className="hidden md:block text-xs text-zinc-600 dark:text-zinc-400 break-words whitespace-pre-line"
                  title={shouldTruncate && !isExpanded ? desc : undefined}
                  style={
                    shouldTruncate && !isExpanded
                      ? {
                          display: "-webkit-box",
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }
                      : undefined
                  }
                >
                  {desc}
                </div>
              ) : null}
              {shouldTruncate ? (
                !isExpanded ? (
                  <button
                    type="button"
                    aria-label="Expand full description"
                    onClick={() =>
                      setExpandedDesc((prev) => ({ ...prev, [id]: true }))
                    }
                    className="hidden md:inline text-[11px] text-black cursor-pointer hover:underline focus:outline-none"
                  >
                    … Show more
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Collapse description"
                    onClick={() =>
                      setExpandedDesc((prev) => ({ ...prev, [id]: false }))
                    }
                    className="hidden md:inline text-[11px] text-black cursor-pointer hover:underline focus:outline-none"
                  >
                    Show less
                  </button>
                )
              ) : null}
            </div>
          );
        },
      },
      {
        id: "type",
        accessorFn: (row) => row._Type,
        header: "Type",
        cell: ({ row }) => {
          const a = row.original;
          const curType = (a._Type || "").trim();

          if (hypotheticalMode && availableCategories.length > 0) {
            return (
              <CategoryEditor
                assignmentId={a._GradebookID}
                currentCategory={curType}
                availableCategories={availableCategories}
                onEditCategoryRef={onEditCategoryRef}
                getTypeColor={getTypeColor}
              />
            );
          }

          return (
            <Badge className={`${getTypeColor(curType || "Uncategorized")}`}>
              {curType || "Uncategorized"}
            </Badge>
          );
        },
      },
      {
        id: "score",
        header: "Score",
        cell: ({ row }) => {
          const a = row.original;
          const assignmentId = a._GradebookID;
          const display = a._DisplayScore || a._Score || "—";

          if (!hypotheticalMode) {
            return assignmentId ? (
              <Link
                href={`/gradebook/${assignmentId}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open grade details for assignment ${assignmentId} in a new tab`}
                className="text-sm text-black dark:text-white hover:underline focus:outline-none"
              >
                {display}
              </Link>
            ) : (
              <span className="text-sm text-black dark:text-white">
                {display}
              </span>
            );
          }

          return (
            <ScoreEditor
              assignmentId={assignmentId}
              draftScoresRef={draftScoresRef}
              setDraftScores={setDraftScores}
              onEditScoreRef={onEditScoreRef}
              debounceTimers={debounceTimers}
            />
          );
        },
      },
      {
        id: "progress",
        header: "Percentage",
        accessorFn: (row) => assignmentPercents[row._GradebookID],
        sortingFn: (
          a: Row<Assignment>,
          b: Row<Assignment>,
          columnId: string,
        ) => {
          const av = Number(a.getValue(columnId));
          const bv = Number(b.getValue(columnId));
          if (isNaN(av) && isNaN(bv)) return 0;
          if (isNaN(av)) return 1;
          if (isNaN(bv)) return -1;
          return av === bv ? 0 : av < bv ? -1 : 1;
        },
        cell: ({ row }) => {
          const pct = assignmentPercents[row.original._GradebookID];
          if (pct == null || isNaN(pct)) {
            return <span className="text-sm text-zinc-400">—</span>;
          }
          const letter = numericToLetterGrade(Math.round(pct));
          getGradeColor(letter);
          const letterBarMap: Record<string, string> = {
            A: "bg-green-600 dark:bg-green-700",
            "A-": "bg-green-600 dark:bg-green-700",
            P: "bg-green-600 dark:bg-green-700",
            "A+": "bg-green-600 dark:bg-green-700",
            B: "bg-blue-600 dark:bg-blue-700",
            "B-": "bg-blue-600 dark:bg-blue-700",
            "B+": "bg-blue-600 dark:bg-blue-700",
            C: "bg-yellow-500 dark:bg-yellow-600",
            "C-": "bg-yellow-500 dark:bg-yellow-600",
            "C+": "bg-yellow-500 dark:bg-yellow-600",
            D: "bg-orange-500 dark:bg-orange-600",
            "D-": "bg-orange-500 dark:bg-orange-600",
            "D+": "bg-orange-500 dark:bg-orange-600",
            F: "bg-red-600 dark:bg-red-700",
            E: "bg-red-600 dark:bg-red-700",
          };
          const barFill =
            letterBarMap[letter] || "bg-zinc-500 dark:bg-zinc-600";
          const width = Math.max(0, Math.min(100, pct));
          return (
            <div
              className="flex items-center gap-2"
              aria-label={`Assignment scored ${pct.toFixed(
                1,
              )} percent (${letter})`}
            >
              <div className="h-2 w-16 rounded bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className={`h-2 transition-all duration-300 ${barFill}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
                {Math.round(pct)}%
              </span>
            </div>
          );
        },
      },
      {
        id: "scoreType",
        header: "Score Type",
        cell: ({ row }) => (
          <span className="text-sm text-black dark:text-white">
            {row.original._ScoreType || "—"}
          </span>
        ),
      },
      {
        id: "points",
        header: "Points",
        cell: ({ row }) => {
          const raw = (row.original._Points || "").trim();
          const display = raw || "—";
          return (
            <span className="text-sm text-black dark:text-white ">
              {display}
            </span>
          );
        },
      },
      {
        id: "notes",
        accessorFn: (row) => row._Notes,
        header: "Notes",
        cell: ({ row }) => {
          const decoded = decodeEntities(row.original._Notes);
          return (
            <span className="text-sm text-black dark:text-white break-words whitespace-pre-line">
              {decoded}
            </span>
          );
        },
      },
      {
        id: "delta",
        header: "Delta",
        sortingFn: (
          a: Row<Assignment>,
          b: Row<Assignment>,
          columnId: string,
        ) => {
          const av = Number(a.getValue(columnId));
          const bv = Number(b.getValue(columnId));
          if (isNaN(av) && isNaN(bv)) return 0;
          if (isNaN(av)) return 1;
          if (isNaN(bv)) return -1;
          return av === bv ? 0 : av < bv ? -1 : 1;
        },
        accessorFn: (row) => deltas[row._GradebookID],
        cell: ({ row }) => {
          const delta = deltas[row.original._GradebookID];
          if (delta == null || isNaN(delta)) {
            return (
              <span
                className="text-sm text-zinc-400"
                title="No score change data"
              >
                —
              </span>
            );
          }
          const EPS = 0.05; // treat very small magnitudes as zero to avoid -0.0%
          const adj = Math.abs(delta) < EPS ? 0 : delta;
          const signPrefixed =
            adj === 0
              ? `${adj.toFixed(1)}%`
              : (adj > 0 ? "+" : "") + adj.toFixed(1) + "%";
          const colorClass =
            adj > 0
              ? "text-green-600"
              : adj < 0
                ? "text-red-600"
                : "text-zinc-600";
          return (
            <span
              className={`text-sm font-medium ${colorClass}`}
              title="Impact on overall % after this assignment"
            >
              {signPrefixed}
            </span>
          );
        },
      },
    ],
    [
      decodeEntities,
      getTypeColor,
      expandedDesc,
      deltas,
      assignmentPercents,
      hypotheticalMode,
      availableCategories,
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {hypotheticalMode && onCreateAssignment && (
                <Button
                  onClick={onCreateAssignment}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  + New Assignment
                </Button>
              )}
              {onToggleHypothetical && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={hypotheticalMode}
                    onCheckedChange={(checked) =>
                      onToggleHypothetical(checked === true)
                    }
                  />
                  <span>Hypothetical Mode</span>
                </label>
              )}
            </div>
            <Input
              placeholder="Filter assignments..."
              value={
                (table.getColumn("measure")?.getFilterValue() as string) ?? ""
              }
              onChange={(e) =>
                table.getColumn("measure")?.setFilterValue(e.target.value)
              }
              className="h-8 w-48"
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
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-950"
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
                    className="h-24 text-center text-sm text-zinc-500"
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
          <div className="w-full flex items-center justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (table.getCanPreviousPage()) table.previousPage();
                    }}
                    className={
                      !table.getCanPreviousPage()
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
                {(() => {
                  const pages: Array<number | string> = [];
                  const total = table.getPageCount();
                  const current = table.getState().pagination.pageIndex;
                  const first = 0;
                  const last = total - 1;
                  if (total <= 7) {
                    for (let i = 0; i < total; i++) pages.push(i);
                  } else {
                    pages.push(first);
                    if (current > 2) pages.push("ellipsis-start");
                    const start = Math.max(first + 1, current - 1);
                    const end = Math.min(last - 1, current + 1);
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (current < last - 2) pages.push("ellipsis-end");
                    pages.push(last);
                  }
                  return pages.map((p, idx) => (
                    <PaginationItem key={`${p}-${idx}`}>
                      {typeof p === "string" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={p === current}
                          onClick={(e) => {
                            e.preventDefault();
                            table.setPageIndex(p);
                          }}
                        >
                          {p + 1}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ));
                })()}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (table.getCanNextPage()) table.nextPage();
                    }}
                    className={
                      !table.getCanNextPage()
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export const AssignmentsTable = React.memo(AssignmentsTableBase);

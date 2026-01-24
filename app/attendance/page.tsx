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
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AttendanceGraph from "@/components/AttendanceGraph";

interface APIAbsencePeriod {
  _Number: string;
  _Name: string;
  _Reason?: string;
  _Course?: string;
  _Staff?: string;
  _StaffEMail?: string;
  _IconName?: string;
  _SchoolName?: string;
}

interface APIAbsenceDay {
  _AbsenceDate: string;
  _Reason?: string;
  _Note?: string;
  _DailyIconName?: string;
  _CodeAllDayReasonType?: string;
  _CodeAllDayDescription?: string;
  Periods?: { Period: APIAbsencePeriod | APIAbsencePeriod[] };
}

interface APIPeriodTotalEntry {
  _Number: string;
  _Total: string;
}
interface APIPeriodTotalsWrapper {
  PeriodTotal: APIPeriodTotalEntry | APIPeriodTotalEntry[];
}

interface AttendanceAPIResponseRoot {
  Absences?: { Absence: APIAbsenceDay | APIAbsenceDay[] };
  TotalExcused?: APIPeriodTotalsWrapper;
  TotalTardies?: APIPeriodTotalsWrapper;
  TotalUnexcused?: APIPeriodTotalsWrapper;
  TotalActivities?: APIPeriodTotalsWrapper;
  TotalUnexcusedTardies?: APIPeriodTotalsWrapper;
  _Type?: string;
  _StartPeriod?: string;
  _EndPeriod?: string;
  _PeriodCount?: string;
  _SchoolName?: string;
}

interface PeriodEntry {
  number: number;
  course: string;
  name: string;
  staff: string;
  staffEmail?: string;
  iconName?: string;
  reason?: string;
}

interface AbsenceDay {
  date: string;
  displayDate: string;
  reason: string;
  note?: string;
  icon?: string;
  periods: PeriodEntry[];
}

interface PeriodTotal {
  number: number;
  total: number;
}

interface AttendanceDataShape {
  schoolName?: string;
  type?: string;
  startPeriod?: number;
  endPeriod?: number;
  absenceDays: AbsenceDay[];
  totals: {
    activities?: PeriodTotal[];
    excused?: PeriodTotal[];
    tardies?: PeriodTotal[];
    unexcused?: PeriodTotal[];
    unexcusedTardies?: PeriodTotal[];
  };
}

interface ScheduleClassListing {
  _Period(_Period: string | number): unknown;
  _CourseTitle: string;
  "@CourseTitle": string;
  "@Period": string | number;
}

export default function AttendancePage() {
  const [dataShape, setDataShape] = useState<AttendanceDataShape | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodNameMap, setPeriodNameMap] = useState<Record<number, string>>(
    {},
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (dateKey: string) => {
    setExpanded((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  useEffect(() => {
    const creds = localStorage.getItem("Student.creds");
    if (!creds) {
      window.location.href = "/login";
      return;
    }
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/synergy/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(JSON.parse(creds)),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const root: AttendanceAPIResponseRoot = await res.json();

        const normalizeArray = <T,>(val: T | T[] | undefined | null): T[] => {
          if (!val) return [];
          return Array.isArray(val) ? val : [val];
        };

        const parsePeriodTotals = (
          w?: APIPeriodTotalsWrapper,
        ): PeriodTotal[] => {
          if (!w) return [];
          const totals = normalizeArray(w.PeriodTotal);
          const result: PeriodTotal[] = [];

          totals.forEach((pt, index) => {
            const total = Number(pt._Total || 0);

            const actualPeriod = index;

            result.push({ number: actualPeriod, total });
          });

          return result;
        };

        const absenceDays: AbsenceDay[] = normalizeArray(root.Absences?.Absence)
          .map((abs) => {
            const periods = normalizeArray(abs.Periods?.Period).map((p) => ({
              number: Number(p._Number || 0),
              course: p._Course || "",
              name: p._Name || "",
              staff: p._Staff || "",
              staffEmail: p._StaffEMail || "",
              iconName: p._IconName || "",
              reason: p._Reason || "",
            }));
            const mmddyyyy = abs._AbsenceDate || "";
            let iso = "";
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(mmddyyyy)) {
              const [m, d, y] = mmddyyyy.split("/");
              iso = `${y}-${m}-${d}`;
            }
            return {
              date: iso || mmddyyyy,
              displayDate: mmddyyyy,
              reason: abs._Reason || abs._CodeAllDayDescription || "",
              note: abs._Note || "",
              icon: abs._DailyIconName || abs._CodeAllDayReasonType || "",
              periods,
            };
          })
          .sort((a, b) => b.date.localeCompare(a.date));

        const dataShape: AttendanceDataShape = {
          schoolName: root._SchoolName,
          type: root._Type,
          startPeriod: root._StartPeriod
            ? Number(root._StartPeriod)
            : undefined,
          endPeriod: root._EndPeriod ? Number(root._EndPeriod) : undefined,
          absenceDays,
          totals: {
            activities: parsePeriodTotals(root.TotalActivities),
            excused: parsePeriodTotals(root.TotalExcused),
            tardies: parsePeriodTotals(root.TotalTardies),
            unexcused: parsePeriodTotals(root.TotalUnexcused),
            unexcusedTardies: parsePeriodTotals(root.TotalUnexcusedTardies),
          },
        };
        setDataShape(dataShape);

        try {
          const schedRes = await fetch(`/api/synergy/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...JSON.parse(creds), term_index: 0 }),
          });
          if (schedRes.ok) {
            const schedJson = await schedRes.json();
            const sched = schedJson?.data?.StudentClassSchedule;
            const classList = sched?.ClassLists?.ClassListing;
            const arr: ScheduleClassListing[] = Array.isArray(classList)
              ? classList
              : classList
                ? [classList]
                : [];
            const map: Record<number, string> = {};
            for (const c of arr) {
              const num = Number(c._Period);
              const title = c._CourseTitle;
              if (!Number.isNaN(num) && title && !map[num]) map[num] = title;
            }
            for (const day of dataShape.absenceDays) {
              for (const p of day.periods) {
                if (p.course && !map[p.number]) map[p.number] = p.course;
              }
            }
            setPeriodNameMap(map);
          } else {
            const map: Record<number, string> = {};
            for (const day of dataShape.absenceDays) {
              for (const p of day.periods) {
                if (p.course && !map[p.number]) map[p.number] = p.course;
              }
            }
            setPeriodNameMap(map);
          }
        } catch {
          const map: Record<number, string> = {};
          for (const day of dataShape.absenceDays) {
            for (const p of day.periods) {
              if (p.course && !map[p.number]) map[p.number] = p.course;
            }
          }
          if (Object.keys(map).length) setPeriodNameMap(map);
        }

        // so you may be like "aram, why are you manually calculating 7th period??"
        // for some reason, the synergy api sometimes omits period 7 totals
        // it has 21 periods but not 7th.
        const calculatePeriod7Totals = () => {
          const period7Totals = {
            excused: 0,
            tardies: 0,
            unexcused: 0,
            activities: 0,
            unexcusedTardies: 0,
          };

          dataShape.absenceDays.forEach((day) => {
            const period7 = day.periods.find((p) => p.number === 7);
            if (period7) {
              const iconName = period7.iconName?.toLowerCase() || "";
              const name = period7.name?.toLowerCase() || "";

              if (iconName.includes("tardy") || name.includes("tardy")) {
                if (
                  iconName.includes("unx") ||
                  iconName.includes("unexcused")
                ) {
                  period7Totals.unexcusedTardies++;
                } else {
                  period7Totals.tardies++;
                }
              } else if (
                iconName.includes("excused") ||
                name.includes("illness")
              ) {
                period7Totals.excused++;
              } else if (iconName.includes("unexcused")) {
                period7Totals.unexcused++;
              } else if (iconName.includes("activity")) {
                period7Totals.activities++;
              }
            }
          });

          return period7Totals;
        };

        const period7Totals = calculatePeriod7Totals();

        // add period 7 to totals if it exists (why? bc studentvue api doesnt show any totals for 7th period???)
        if (
          period7Totals.excused > 0 ||
          period7Totals.tardies > 0 ||
          period7Totals.unexcused > 0 ||
          period7Totals.activities > 0 ||
          period7Totals.unexcusedTardies > 0 ||
          dataShape.absenceDays.some((day) =>
            day.periods.some((p) => p.number === 7),
          )
        ) {
          if (!dataShape.totals.excused?.find((p) => p.number === 7)) {
            dataShape.totals.excused?.push({
              number: 7,
              total: period7Totals.excused,
            });
          }
          if (!dataShape.totals.tardies?.find((p) => p.number === 7)) {
            dataShape.totals.tardies?.push({
              number: 7,
              total: period7Totals.tardies,
            });
          }
          if (!dataShape.totals.unexcused?.find((p) => p.number === 7)) {
            dataShape.totals.unexcused?.push({
              number: 7,
              total: period7Totals.unexcused,
            });
          }
          if (!dataShape.totals.activities?.find((p) => p.number === 7)) {
            dataShape.totals.activities?.push({
              number: 7,
              total: period7Totals.activities,
            });
          }
          if (!dataShape.totals.unexcusedTardies?.find((p) => p.number === 7)) {
            dataShape.totals.unexcusedTardies?.push({
              number: 7,
              total: period7Totals.unexcusedTardies,
            });
          }
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 min-h-screen dark:bg-zinc-900">
      <p className="text-xl font-medium pb-3">
        {isLoading ? <Skeleton className="h-7 w-[120px]" /> : "Attendance"}
      </p>
      {!isLoading && !dataShape?.absenceDays?.length ? (
        <div>No attendance anomalies found.</div>
      ) : (
        <>
          <div className="space-y-5">
            <>
              <AttendanceGraph
                dataShape={dataShape}
                isLoading={isLoading}
                periodNameMap={periodNameMap}
              />
              <Table className="px-8">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {isLoading ? <Skeleton className="h-4 w-16" /> : "Period"}
                    </TableHead>
                    <TableHead>
                      {isLoading ? (
                        <Skeleton className="h-4 w-20" />
                      ) : (
                        "Activities"
                      )}
                    </TableHead>
                    <TableHead>
                      {isLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        "Excused"
                      )}
                    </TableHead>
                    <TableHead>
                      {isLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        "Tardies"
                      )}
                    </TableHead>
                    <TableHead>
                      {isLoading ? (
                        <Skeleton className="h-4 w-20" />
                      ) : (
                        "Unexcused"
                      )}
                    </TableHead>
                    <TableHead>
                      {isLoading ? (
                        <Skeleton className="h-4 w-32" />
                      ) : (
                        "Unexcused Tardies"
                      )}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array.from({ length: 7 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                        </TableRow>
                      ))
                    : (() => {
                        const nums = new Set<number>();
                        const pushNums = (
                          list?: { number: number; total: number }[],
                        ) => list?.forEach((l) => nums.add(l.number));
                        pushNums(dataShape?.totals.activities);
                        pushNums(dataShape?.totals.excused);
                        pushNums(dataShape?.totals.tardies);
                        pushNums(dataShape?.totals.unexcused);
                        pushNums(dataShape?.totals.unexcusedTardies);
                        Object.keys(periodNameMap).forEach((k) =>
                          nums.add(Number(k)),
                        );
                        dataShape?.absenceDays.forEach((day) =>
                          day.periods.forEach((p) => nums.add(p.number)),
                        );
                        const sorted = Array.from(nums).sort((a, b) => a - b);
                        return sorted
                          .map((n) => {
                            const find = (
                              list?: { number: number; total: number }[],
                            ) => list?.find((l) => l.number === n)?.total ?? 0;
                            const a = find(dataShape?.totals.activities);
                            const e = find(dataShape?.totals.excused);
                            const t = find(dataShape?.totals.tardies);
                            const u = find(dataShape?.totals.unexcused);
                            const ut = find(dataShape?.totals.unexcusedTardies);

                            const hasAbsences = dataShape?.absenceDays.some(
                              (day) => day.periods.some((p) => p.number === n),
                            );

                            if (
                              !periodNameMap[n] &&
                              a + e + t + u + ut === 0 &&
                              !hasAbsences
                            )
                              return null;
                            const label = periodNameMap[n]
                              ? `${n} – ${periodNameMap[n]}`
                              : String(n);
                            return (
                              <TableRow key={n}>
                                <TableCell
                                  className="max-w-[260px] truncate"
                                  title={label}
                                >
                                  {label}
                                </TableCell>
                                <TableCell>{a}</TableCell>
                                <TableCell>{e}</TableCell>
                                <TableCell>{t}</TableCell>
                                <TableCell>{u}</TableCell>
                                <TableCell>{ut}</TableCell>
                              </TableRow>
                            );
                          })
                          .filter(Boolean);
                      })()}
                </TableBody>
              </Table>
            </>
            {!isLoading &&
              dataShape?.absenceDays.map((a) => {
                const isOpen = expanded[a.date] ?? false;
                return (
                  <Card key={a.date} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="pr-4">
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={isOpen ? "Collapse" : "Expand"}
                            onClick={() => toggleExpand(a.date)}
                            className="rounded border px-2 py-0.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-950 transition"
                          >
                            {isOpen ? "−" : "+"}
                          </button>
                          {a.displayDate}
                        </h2>
                        <p className="text-sm pt-2 text-zinc-500">
                          {a.reason || "(No reason)"} -{" "}
                          {a.note && <span>{a.note}</span>}
                        </p>
                      </div>
                    </div>
                    {isOpen && (
                      <div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[60px]">#</TableHead>
                              <TableHead>Course</TableHead>
                              <TableHead>Staff</TableHead>
                              <TableHead>Reason</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {a.periods.map((p) => (
                              <TableRow key={p.number}>
                                <TableCell>{p.number}</TableCell>
                                <TableCell
                                  className="max-w-[260px] truncate"
                                  title={p.course}
                                >
                                  {p.course}
                                </TableCell>
                                <TableCell>{p.staff}</TableCell>
                                <TableCell>{p.reason || p.name}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </Card>
                );
              })}
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="pr-4 flex-1">
                      <h2 className="font-semibold text-lg mb-2">
                        <Skeleton className="h-6 w-[120px]" />
                      </h2>
                      <p className="text-sm pt-2">
                        <Skeleton className="h-4 w-[200px]" />
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </>
      )}
      <p className="text-xs text-zinc-500 mt-4">
        {isLoading ? (
          <Skeleton className="h-4 w-[200px]" />
        ) : (
          `Rendered ${dataShape?.absenceDays.length || 0} attendance anomalies.`
        )}
      </p>
    </div>
  );
}

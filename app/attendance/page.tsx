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
import { Skeleton } from "@/components/ui/skeleton";
import AttendanceGraph from "@/components/AttendanceGraph";
import { getStoredCredentials, synergyPost } from "@/lib/clientApi";

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

  useEffect(() => {
    const creds = getStoredCredentials();
    if (!creds) {
      window.location.href = "/login";
      return;
    }
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const root = await synergyPost<AttendanceAPIResponseRoot>(
          "/api/synergy/attendance",
          creds,
        );

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

        const map: Record<number, string> = {};
        try {
          const schedJson = await synergyPost<{
            data?: {
              StudentClassSchedule?: {
                ClassLists?: {
                  ClassListing?: ScheduleClassListing | ScheduleClassListing[];
                };
              };
            };
          }>("/api/synergy/schedule", creds, { term_index: 0 });
          const classList =
            schedJson?.data?.StudentClassSchedule?.ClassLists?.ClassListing;
          for (const c of normalizeArray(classList)) {
            const num = Number(c._Period);
            const title = c._CourseTitle;
            if (!Number.isNaN(num) && title && !map[num]) map[num] = title;
          }
        } catch {}
        // fall back to course names recorded on the absences themselves
        for (const day of dataShape.absenceDays) {
          for (const p of day.periods) {
            if (p.course && !map[p.number]) map[p.number] = p.course;
          }
        }
        setPeriodNameMap(map);

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
            {(() => {
              const periodNums = Array.from(
                new Set(
                  dataShape?.absenceDays.flatMap((d) =>
                    d.periods.map((p) => p.number),
                  ) ?? [],
                ),
              ).sort((a, b) => a - b);

              return (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          {isLoading ? <Skeleton className="h-4 w-24" /> : "Date"}
                        </TableHead>
                        <TableHead>
                          {isLoading ? <Skeleton className="h-4 w-20" /> : "Reason"}
                        </TableHead>
                        {isLoading
                          ? Array.from({ length: 7 }).map((_, i) => (
                              <TableHead key={i}>
                                <Skeleton className="h-4 w-6" />
                              </TableHead>
                            ))
                          : periodNums.map((n) => (
                              <TableHead key={n} className="text-center whitespace-nowrap">
                                {n}
                              </TableHead>
                            ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                              {Array.from({ length: 7 }).map((_, j) => (
                                <TableCell key={j}><Skeleton className="h-4 w-12" /></TableCell>
                              ))}
                            </TableRow>
                          ))
                        : dataShape?.absenceDays.map((day) => (
                            <TableRow key={day.date}>
                              <TableCell className="text-sm whitespace-nowrap">
                                {day.date}
                              </TableCell>
                              <TableCell className="text-sm whitespace-nowrap">
                                {day.reason || ""}
                              </TableCell>
                              {periodNums.map((n) => {
                                const p = day.periods.find((p) => p.number === n);
                                return (
                                  <TableCell key={n} className="text-center text-sm">
                                    {p ? (
                                      <span title={p.reason || p.name}>
                                        {p.name || p.reason || "None"}
                                      </span>
                                    ) : (
                                      <span className="text-gray-600">N/A</span>
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}
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

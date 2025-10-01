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
import {
  Card
} from "@/components/ui/card";

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
    const creds = localStorage.getItem("studentvue-creds");
    if (!creds) {
      window.location.href = "/";
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
          return normalizeArray(w.PeriodTotal).map((pt) => ({
            number: Number(pt._Number || 0),
            total: Number(pt._Total || 0),
          }));
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
            if (Object.keys(map).length) setPeriodNameMap(map);
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
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

  if (isLoading) return <div className="p-8">Loading attendance...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <p className="text-xl font-medium pb-3">Attendance</p>
      {!dataShape?.absenceDays?.length ? (
        <div>No absence records.</div>
      ) : (
        <div className="space-y-6">
          <div className="text-sm text-gray-500 flex flex-wrap gap-4">
            <span>{dataShape.absenceDays.length} days absent total.</span>
          </div>

          <Table className="px-8">
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Activities</TableHead>
                <TableHead>Excused</TableHead>
                <TableHead>Tardies</TableHead>
                <TableHead>Unexcused</TableHead>
                <TableHead>Unexcused Tardies</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const nums = new Set<number>();
                const pushNums = (list?: { number: number; total: number }[]) =>
                  list?.forEach((l) => nums.add(l.number));
                pushNums(dataShape?.totals.activities);
                pushNums(dataShape?.totals.excused);
                pushNums(dataShape?.totals.tardies);
                pushNums(dataShape?.totals.unexcused);
                pushNums(dataShape?.totals.unexcusedTardies);
                Object.keys(periodNameMap).forEach((k) => nums.add(Number(k)));
                dataShape?.absenceDays.forEach((day) =>
                  day.periods.forEach((p) => nums.add(p.number)),
                );
                const activePeriodNums = new Set<number>();
                Object.keys(periodNameMap).forEach((k) =>
                  activePeriodNums.add(Number(k)),
                );
                dataShape?.absenceDays.forEach((day) =>
                  day.periods.forEach((p) => activePeriodNums.add(p.number)),
                );
                const sorted = Array.from(nums).sort((a, b) => a - b);
                return sorted
                  .map((n) => {
                    const find = (list?: { number: number; total: number }[]) =>
                      list?.find((l) => l.number === n)?.total ?? 0;
                    const a = find(dataShape?.totals.activities);
                    const e = find(dataShape?.totals.excused);
                    const t = find(dataShape?.totals.tardies);
                    const u = find(dataShape?.totals.unexcused);
                    const ut = find(dataShape?.totals.unexcusedTardies);
                    if (
                      !periodNameMap[n] &&
                      a + e + t + u + ut === 0 &&
                      !activePeriodNums.has(n)
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
          {dataShape.absenceDays.map((a) => {
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
                        className="rounded border px-2 py-0.5 text-xs font-medium hover:bg-gray-100 transition"
                      >
                        {isOpen ? "−" : "+"}
                      </button>
                      {a.displayDate}
                    </h2>
                    <p className="text-sm pt-2 text-gray-500">
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
        </div>
      )}
      <p className="text-xs text-gray-400 mt-4">
        Rendered {dataShape?.absenceDays.length || 0} absence day(s).
      </p>
    </div>
  );
}

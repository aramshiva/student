"use client";

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface PeriodEntry {
  Number: number;
  Course: string;
  Name: string;
  Staff: string;
  StaffEmail?: string;
  IconName?: string;
  Reason?: string;
}

interface AbsenceDay {
  date: string;
  reason: string;
  note?: string;
  icon?: string;
  periods: PeriodEntry[];
  raw: Record<string, unknown>;
}

interface PeriodTotal {
  Number: number;
  Total: number;
}

interface AttendanceDataShape {
  schoolName?: string;
  type?: string;
  startPeriod?: number;
  endPeriod?: number;
  absences: AbsenceDay[];
  totals: {
    activities?: PeriodTotal[];
    excused?: PeriodTotal[];
    tardies?: PeriodTotal[];
    unexcused?: PeriodTotal[];
    unexcusedTardies?: PeriodTotal[];
  };
}

export default function AttendancePage() {
  const [dataShape, setDataShape] = useState<AttendanceDataShape | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds = localStorage.getItem("studentvue-creds");
    if (!creds) {
      window.location.href = "/";
      return;
    }
    setIsLoading(true);
    setError(null);
    fetch(`https://${process.env.NEXT_PUBLIC_APIVUE_SERVER_URL}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(JSON.parse(creds)),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const attRoot = data?.data?.Attendance;
        if (!attRoot) {
          setDataShape({ absences: [], totals: {} });
          return;
        }

        const absList = attRoot?.Absences?.Absence || [];
        const absArray = Array.isArray(absList) ? absList : [absList];
        const absences: AbsenceDay[] = absArray.map((aRaw: unknown) => {
          interface Indexable { [key: string]: unknown }
          const a = aRaw as Indexable;
          const get = (o: Indexable | undefined | null, ...keys: string[]): unknown => {
            if (!o) return undefined;
            for (const k of keys) {
              const v = o[k];
              if (v !== undefined && v !== null && v !== "") return v;
            }
            return undefined;
          };
          const periodsNode = a["Periods"] as Indexable | undefined;
          const periodsRaw = (periodsNode?.["Period"] as unknown) || [];
          const periodArr = Array.isArray(periodsRaw) ? periodsRaw : periodsRaw ? [periodsRaw] : [];
          const periods: PeriodEntry[] = periodArr.map(pRaw => {
            const p = pRaw as Indexable;
            return {
              Number: Number(get(p, "@Number", "Number") ?? 0),
              Course: String(get(p, "@Course", "Course") ?? ""),
              Name: String(get(p, "@Name", "Name") ?? ""),
              Staff: String(get(p, "@Staff", "Staff") ?? ""),
              StaffEmail: String(get(p, "@StaffEMail", "StaffEMail") ?? ""),
              IconName: String(get(p, "@IconName", "IconName") ?? ""),
              Reason: String(get(p, "@Reason", "Reason") ?? ""),
            };
          });
          return {
            date: String(get(a, "@AbsenceDate", "Date") ?? ""),
            reason: String(get(a, "@Reason", "@CodeAllDayDescription", "Reason") ?? ""),
            note: String(get(a, "@Note", "Note") ?? ""),
            icon: String(get(a, "@DailyIconName", "DailyIconName") ?? ""),
            periods,
            raw: a,
          };
        });

        const parseTotals = (node: unknown): PeriodTotal[] => {
          if (!node) return [];
          const n = node as { [key: string]: unknown };
          const ptRaw = n["PeriodTotal"] as unknown;
          const list = Array.isArray(ptRaw) ? ptRaw : ptRaw ? [ptRaw] : [];
          return list.map(item => {
            const it = item as { [key: string]: unknown };
            return {
              Number: Number(it["@Number"] ?? it["Number"] ?? 0),
              Total: Number(it["@Total"] ?? it["Total"] ?? 0),
            };
          });
        };

        const totals = {
          activities: parseTotals(attRoot?.TotalActivities),
            excused: parseTotals(attRoot?.TotalExcused),
            tardies: parseTotals(attRoot?.TotalTardies),
            unexcused: parseTotals(attRoot?.TotalUnexcused),
            unexcusedTardies: parseTotals(attRoot?.TotalUnexcusedTardies),
        };

        setDataShape({
          schoolName: attRoot?.["@SchoolName"],
          type: attRoot?.["@Type"],
          startPeriod: attRoot?.["@StartPeriod"],
          endPeriod: attRoot?.["@EndPeriod"],
          absences,
          totals,
        });
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="p-8">Loading attendance...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-4">Attendance</h1>
          {!dataShape?.absences?.length ? (
            <div>No absence records.</div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                {dataShape.schoolName && <span><strong>School:</strong> {dataShape.schoolName}</span>}
                {dataShape.type && <span><strong>Type:</strong> {dataShape.type}</span>}
                {typeof dataShape.startPeriod !== "undefined" && typeof dataShape.endPeriod !== "undefined" && (
                  <span><strong>Periods:</strong> {dataShape.startPeriod} - {dataShape.endPeriod}</span>
                )}
                <span><strong>Total Absence Days:</strong> {dataShape.absences.length}</span>
              </div>

              {dataShape.absences.map((a) => (
                <Card key={a.date} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-lg">{a.date}</h2>
                      <p className="text-sm text-gray-700">{a.reason || "(No reason)"}</p>
                      {a.note && <p className="text-xs mt-1 text-gray-500 italic">Note: {a.note}</p>}
                    </div>
                  </div>
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
                        {a.periods.map(p => (
                          <TableRow key={p.Number}>
                            <TableCell>{p.Number}</TableCell>
                            <TableCell className="max-w-[260px] truncate" title={p.Course}>{p.Course}</TableCell>
                            <TableCell>{p.Staff}</TableCell>
                            <TableCell>{p.Reason || p.Name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              ))}

              <Card className="p-4">
                <h2 className="font-semibold mb-3">Period Totals</h2>
                <Table>
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
                      const pushNums = (list?: { Number: number; Total: number }[]) => list?.forEach(l => nums.add(l.Number));
                      pushNums(dataShape?.totals.activities);
                      pushNums(dataShape?.totals.excused);
                      pushNums(dataShape?.totals.tardies);
                      pushNums(dataShape?.totals.unexcused);
                      pushNums(dataShape?.totals.unexcusedTardies);
                      const sorted = Array.from(nums).sort((a,b)=>a-b);
                      return sorted.map(n => {
                        const find = (list?: { Number: number; Total: number }[]) => list?.find(l => l.Number === n)?.Total ?? 0;
                        return (
                          <TableRow key={n}>
                            <TableCell>{n}</TableCell>
                            <TableCell>{find(dataShape?.totals.activities)}</TableCell>
                            <TableCell>{find(dataShape?.totals.excused)}</TableCell>
                            <TableCell>{find(dataShape?.totals.tardies)}</TableCell>
                            <TableCell>{find(dataShape?.totals.unexcused)}</TableCell>
                            <TableCell>{find(dataShape?.totals.unexcusedTardies)}</TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
      <p className="text-xs text-gray-400 mt-4">Rendered {dataShape?.absences.length || 0} absence day(s).</p>
    </div>
  );
}

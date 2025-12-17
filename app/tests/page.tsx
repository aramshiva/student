"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BadgeQuestionMark } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

interface AnalysisTest {
  GU?: string;
  Name?: string;
  GridData?: Record<string, string>[];
  GridColumns?: string[];
  ChartData?: unknown;
  LegendData?: unknown;
  ShowChart?: boolean;
  GroupOrder?: string;
}

interface TestsApiResponse {
  analysis?: {
    availableTests?: AnalysisTest[];
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export default function TestsPage() {
  const [data, setData] = useState<AnalysisTest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const theme = useTheme();

  const fetchTests = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const credsRaw = localStorage.getItem("Student.creds");
      if (!credsRaw) {
        window.location.href = "/login";
        return;
      }
      const res = await fetch("/api/synergy/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: credsRaw,
      });
      if (!res.ok) {
        throw new Error(`Tests HTTP ${res.status}`);
      }
      const json: TestsApiResponse = await res.json();
      const tests = json?.analysis?.availableTests || [];
      setData(tests);

      if (tests.length === 0 && retryCount < 3) {
        const delays = [1000, 5000, 30000];
        const delay = delays[retryCount];
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, delay);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const content = useMemo(() => {
    const prettify = (label: string) => {
      if (!label) return label;
      if (label.includes(" ")) return label;
      let spaced = label.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
      spaced = spaced.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
      return spaced.trim();
    };
    const mergeSparseRows = (
      rows: Record<string, string>[],
      columns: string[],
    ): Record<string, string>[] => {
      const acc: Record<string, string>[] = [];
      rows.forEach((row) => {
        const idx = acc.findIndex((existing) => {
          for (const col of columns) {
            const ev = existing[col];
            const rv = row[col];
            if (ev && rv && ev !== rv) return false;
          }
          return true;
        });
        if (idx === -1) {
          acc.push({ ...row });
        } else {
          const existing = acc[idx];
          for (const col of columns) {
            if ((!existing[col] || existing[col] === "") && row[col]) {
              existing[col] = row[col];
            }
          }
        }
      });
      return acc;
    };
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <CardHeader className="py-2 px-0">
                <CardTitle className="text-sm font-medium">
                  <Skeleton
                    {...(theme.theme === "dark"
                      ? { baseColor: "#202020", highlightColor: "#444" }
                      : {})}
                    className="h-4 w-48"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-0">
                {Array.from({ length: 4 }).map((__, r) => (
                  <Skeleton
                    key={r}
                    {...(theme.theme === "dark"
                      ? { baseColor: "#202020", highlightColor: "#444" }
                      : {})}
                    className="h-3 w-full"
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    if (error) {
      return <div className="text-sm text-red-600">{error}</div>;
    }
    if (!data || data.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BadgeQuestionMark />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyTitle>No tests found</EmptyTitle>
          <EmptyDescription>
            No test history found! If you believe this is an error, please
            contact your district or open a{" "}
            <Link href="/feedback">feedback issue</Link>
          </EmptyDescription>
        </Empty>
      );
    }

    return (
      <div className="space-y-6">
        {data.map((test) => {
          const cols = test.GridColumns || [];
          const rawRows = test.GridData || [];
          const rows = mergeSparseRows(rawRows, cols);
          const formatDate = (raw?: string) => {
            if (!raw) return "";
            const d = new Date(raw.replace(/ 00:00:00 AM$/i, ""));
            if (!isNaN(d.getTime())) {
              return d.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
            }
            return raw;
          };
          return (
            <Card key={test.GU || test.Name} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{test.Name || "Untitled Test"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {cols.map((c) => (
                        <TableHead key={c}>{prettify(c)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i}>
                        {cols.map((c) => {
                          let val = r[c];
                          if (c === "AdminDate") val = formatDate(val);
                          return (
                            <TableCell key={c} className="align-top">
                              {val ?? ""}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }, [data, error, loading, theme.theme]);

  return (
    <div className="p-6 space-y-6 min-h-screen dark:bg-zinc-900">{content}</div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportingPeriod {
  _ReportingPeriodGU: string;
  _ReportingPeriodName: string;
  _EndDate: string;
  _Message?: string;
  _DocumentGU?: string;
}

interface ReportCardListResponse {
  RCReportingPeriodData?: {
    RCReportingPeriods?: {
      RCReportingPeriod?: ReportingPeriod[] | ReportingPeriod;
    };
  };
}

interface ReportCardGetResponse {
  Base64Code?: string;
  _DocType?: string;
  _FileName?: string;
  _DocFileName?: string;
  _DocumentGU?: string;
}

function normalizePeriods(resp: ReportCardListResponse): ReportingPeriod[] {
  const list =
    resp?.RCReportingPeriodData?.RCReportingPeriods?.RCReportingPeriod;
  if (!list) return [];
  return Array.isArray(list) ? list : [list];
}

export default function ReportCardsPage() {
  const router = useRouter();
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    const credsRaw = localStorage.getItem("Student.creds");
    if (!credsRaw) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = JSON.parse(credsRaw);
      const res = await fetch("/api/synergy/reportcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: ReportCardListResponse = await res.json();
      setPeriods(normalizePeriods(data));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const openPdf = useCallback(
    async (documentGuid: string) => {
      const credsRaw = localStorage.getItem("Student.creds");
      if (!credsRaw) {
        router.push("/login");
        return;
      }
      setDownloadingId(documentGuid);
      try {
        const body = { ...JSON.parse(credsRaw), document_guid: documentGuid };
        const res = await fetch("/api/synergy/reportcard/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: ReportCardGetResponse = await res.json();
        const base64 = data.Base64Code;
        if (!base64) throw new Error("No PDF returned");

        const byteChars = atob(base64);
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNums[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNums);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        // Open in new tab
        window.open(url, "_blank");

        // Optional: revoke after a delay to allow the tab to load
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setDownloadingId(null);
      }
    },
    [router],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardHeader>
            <CardTitle>Report Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
      {periods.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No report cards available.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((p) => {
              const hasPdf = !!(p._DocumentGU && p._DocumentGU.trim());
              const status = hasPdf ? "PDF available" : "No PDF";
              return (
                <TableRow key={p._ReportingPeriodGU}>
                  <TableCell className="font-medium">
                    {p._ReportingPeriodName}
                  </TableCell>
                  <TableCell>{p._EndDate}</TableCell>
                  <TableCell>{status}</TableCell>
                  <TableCell className="text-right">
                    {hasPdf ? (
                      <Button
                        size="sm"
                        onClick={() => openPdf(p._DocumentGU!)}
                        disabled={downloadingId === p._DocumentGU}
                      >
                        {downloadingId === p._DocumentGU
                          ? "Opening…"
                          : "View PDF"}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        Not available
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

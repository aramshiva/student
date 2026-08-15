"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { columns, type Staff } from "./columns";
import { DataTable } from "./data-table";
import { getStoredCredentials, synergyPost } from "@/lib/clientApi";

interface SchoolInfoResponse {
  school?: string;
  principal?: string;
  schoolAddress?: string;
  schoolAddress2?: string;
  schoolCity?: string;
  schoolState?: string;
  schoolZip?: string;
  phone?: string;
  phone2?: string;
  URL?: string;
  principalEmail?: string;
  staffLists?: Staff[] | Staff;
}

function normalizeStaff(data?: SchoolInfoResponse | null): Staff[] {
  const raw = data?.staffLists;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export default function SchoolInfoPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [info, setInfo] = useState<SchoolInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async () => {
    const creds = getStoredCredentials();
    if (!creds) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await synergyPost<SchoolInfoResponse>(
        "/api/synergy/school/info",
        creds,
      );
      setInfo(data ?? null);
      setStaff(normalizeStaff(data));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const address = useMemo(() => {
    if (!info) return "";
    const parts = [
      info.schoolAddress,
      info.schoolAddress2,
      [info.schoolCity, info.schoolState, info.schoolZip]
        .filter(Boolean)
        .join(", "),
    ].filter((p) => p && String(p).trim().length > 0);
    return parts.join("\n");
  }, [info]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 p-9">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
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
    <div className="min-h-screen bg-white dark:bg-zinc-900 p-9 space-y-6">
      <p className="text-xl">{info?.school || "School Info"}</p>
      <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
        {info?.principal && (
          <div>
            <span className="font-medium">Principal:</span> {info.principal}
            {info.principalEmail && (
              <a
                className="ml-2 underline"
                href={`mailto:${info.principalEmail}`}
              >
                {info.principalEmail}
              </a>
            )}
          </div>
        )}
        {address && (
          <div className="whitespace-pre-line">
            <span className="font-medium">Address:</span> {address}
          </div>
        )}
        {(info?.phone || info?.phone2) && (
          <div>
            <span className="font-medium">Phone:</span> {info.phone}
            {info.phone2 ? (
              <span className="ml-2">
                <span className="font-medium">Fax:</span> {info.phone2}
              </span>
            ) : null}
          </div>
        )}
        {info?.URL && (
          <div>
            <a
              className="underline"
              href={info.URL}
              target="_blank"
              rel="noreferrer"
            >
              {info.URL}
            </a>
          </div>
        )}
      </div>

      <p className="text-lg pt-2">Staff Directory</p>
      <DataTable columns={columns} data={staff} />
    </div>
  );
}

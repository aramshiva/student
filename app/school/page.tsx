"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { columns, type Staff } from "./columns";
import { DataTable } from "./data-table";

interface SchoolInfoResponse {
  StudentSchoolInfoListing?: {
    StaffLists?: {
      StaffList?: Staff[] | Staff;
    };
    _School?: string;
    _Principal?: string;
    _SchoolAddress?: string;
    _SchoolAddress2?: string;
    _SchoolCity?: string;
    _SchoolState?: string;
    _SchoolZip?: string;
    _Phone?: string;
    _Phone2?: string;
    _URL?: string;
    _PrincipalEmail?: string;
  };
}

function normalizeStaff(
  listing?: SchoolInfoResponse["StudentSchoolInfoListing"],
): Staff[] {
  const raw = listing?.StaffLists?.StaffList;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export default function SchoolInfoPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [info, setInfo] = useState<
    SchoolInfoResponse["StudentSchoolInfoListing"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async () => {
    const credsRaw = localStorage.getItem("Student.creds");
    if (!credsRaw) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = JSON.parse(credsRaw);
      const res = await fetch("/api/synergy/school-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: SchoolInfoResponse = await res.json();
      const listing = data?.StudentSchoolInfoListing;
      setInfo(listing ?? null);
      setStaff(normalizeStaff(listing));
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
      info._SchoolAddress,
      info._SchoolAddress2,
      [info._SchoolCity, info._SchoolState, info._SchoolZip]
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
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {info?._School || "School Info"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          {info?._Principal && (
            <div>
              <span className="font-medium">Principal:</span> {info._Principal}
              {info._PrincipalEmail && (
                <a
                  className="ml-2 underline"
                  href={`mailto:${info._PrincipalEmail}`}
                >
                  {info._PrincipalEmail}
                </a>
              )}
            </div>
          )}
          {address && (
            <div className="whitespace-pre-line">
              <span className="font-medium">Address:</span> {address}
            </div>
          )}
          {(info?._Phone || info?._Phone2) && (
            <div>
              <span className="font-medium">Phone:</span> {info._Phone}
              {info._Phone2 ? (
                <span className="ml-2">
                  <span className="font-medium">Fax:</span> {info._Phone2}
                </span>
              ) : null}
            </div>
          )}
          {info?._URL && (
            <div>
              <a
                className="underline"
                href={info._URL}
                target="_blank"
                rel="noreferrer"
              >
                {info._URL}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={staff} />
        </CardContent>
      </Card>
    </div>
  );
}

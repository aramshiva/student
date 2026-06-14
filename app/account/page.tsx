"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getStoredCredentials, synergyPost } from "@/lib/clientApi";

interface AccountData {
  name: string | null;
  userID: string | number | null;
  email: string | null;
  homeAddress: string | null;
  mailAddress: string | null;
}

function htmlToLines(value: string | number | null | undefined): string | null {
  if (value == null || value === "") return null;
  let text = String(value).replace(/<br\s*\/?>/gi, "\n");
  let prev: string;
  do {
    prev = text;
    text = text.replace(/<[^>]*>/g, "");
  } while (text !== prev);
  const cleaned = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
  return cleaned || null;
}

export default function AccountPage() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState("");
  const [school, setSchool] = useState("");

  useEffect(() => {
    const creds = getStoredCredentials();
    if (!creds) {
      window.location.href = "/login";
      return;
    }
    try {
      setPhotoBase64(localStorage.getItem("Student.studentPhoto") || "");
      setSchool(localStorage.getItem("Student.studentSchool") || "");
    } catch {}

    synergyPost<AccountData>("/api/synergy/account", creds)
      .then(setAccount)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  const name = htmlToLines(account?.name);
  const userID = htmlToLines(account?.userID);
  const email = htmlToLines(account?.email);
  const homeAddress = htmlToLines(account?.homeAddress);
  const mailAddress = htmlToLines(account?.mailAddress);
  const rows: { label: string; value: React.ReactNode }[] = [];
  if (homeAddress)
    rows.push({
      label: "Home Address",
      value: <span className="whitespace-pre-line">{homeAddress}</span>,
    });
  if (mailAddress)
    rows.push({
      label: "Mailing Address",
      value: <span className="whitespace-pre-line">{mailAddress}</span>,
    });

  return (
    <>
      <div className="p-8 space-y-5 min-h-screen dark:bg-zinc-900">
        <div className="flex items-center gap-8">
          {loading ? (
            <Skeleton className="h-20 w-20 rounded-full" />
          ) : (
            photoBase64 && (
              <Image
                src={`data:image/png;base64,${photoBase64}`}
                alt="Student Photo"
                width={80}
                height={80}
                className="rounded-full h-22 w-22 aspect-square object-cover border"
              />
            )
          )}
          <div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-40" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-medium font-[Montreal,sans]">
                  {name || "My Account"}
                </h1>
                {school && (
                  <p className="text-sm font-medium">
                    {school}
                  </p>
                )}
                {userID && email && (
                  <p className="text-xs text-muted-foreground">
                    {email} - <span className="mb-0">{userID}</span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <Card className="pt-5 pb-4 max-w-2xl">
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="py-3 flex items-center justify-between"
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Your district didn&apos;t return any address information.
              </div>
            ) : (
              <div className="divide-y">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="py-3 flex items-start justify-between gap-6"
                  >
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {row.label}
                    </span>
                    <span className="text-sm font-medium text-right break-words min-w-0">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

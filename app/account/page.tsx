"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getStoredCredentials, synergyPost } from "@/lib/clientApi";
import {
  infoField as field,
  unwrapStudentInfo,
  type StudentInfoRecord as StudentInfo,
} from "@/lib/studentInfo";
import type { StudentPageMeta, StudentPageSection } from "@/lib/studentPage";

interface AccountData {
  name: string | null;
  userID: string | number | null;
  email: string | null;
  homeAddress: string | null;
  mailAddress: string | null;
}

interface Row {
  label: string;
  value: string;
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

function prettyKey(key: string): string {
  return key
    .replace(/^[@_]+/, "")
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function isPhotoish(label: string, value: string): boolean {
  return /photo|image/i.test(label) || value.length > 400;
}

// walks whatever is left of the payload so nothing the district sends is dropped
function flatten(value: unknown, prefix: string[], out: Row[]): void {
  if (value == null) return;
  if (Array.isArray(value)) {
    value.forEach((item, i) =>
      flatten(item, [...prefix, value.length > 1 ? `#${i + 1}` : ""], out),
    );
    return;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (key === "$" || key === "#text") flatten(child, prefix, out);
      else flatten(child, [...prefix, prettyKey(key)], out);
    }
    return;
  }
  const text = htmlToLines(String(value));
  if (!text) return;
  const label = prefix.filter(Boolean).join(" · ") || "Value";
  if (isPhotoish(label, text)) return;
  out.push({ label, value: text });
}

function rowsFor(
  info: StudentInfo,
  fields: [label: string, key: string][],
): Row[] {
  const rows: Row[] = [];
  for (const [label, key] of fields) {
    const value = htmlToLines(field(info, key));
    if (value) rows.push({ label, value });
  }
  return rows;
}

function contactRows(
  source: unknown,
  fields: [label: string, key: string][],
): Row[] {
  const rows: Row[] = [];
  for (const [label, key] of fields) {
    const value = htmlToLines(field(source, key));
    if (value) rows.push({ label, value });
  }
  return rows;
}

const PERSONAL_FIELDS: [string, string][] = [
  ["Name", "FormattedName"],
  ["Goes By", "LastNameGoesBy"],
  ["Nickname", "NickName"],
  ["Birth Date", "BirthDate"],
  ["Gender", "Gender"],
  ["Home Language", "HomeLanguage"],
  ["Phone", "Phone"],
  ["Email", "EMail"],
  ["Address", "Address"],
];

const SCHOOL_FIELDS: [string, string][] = [
  ["School", "CurrentSchool"],
  ["Grade", "Grade"],
  ["Track", "Track"],
  ["Home Room", "HomeRoom"],
  ["Home Room Teacher", "HomeRoomTch"],
  ["Home Room Teacher Email", "HomeRoomTchEMail"],
  ["Counselor", "CounselorName"],
  ["Counselor Email", "CounselorEmail"],
  ["Perm ID", "PermID"],
];

const PROVIDER_FIELDS: [string, string][] = [
  ["Name", "Name"],
  ["Hospital", "Hospital"],
  ["Office", "Office"],
  ["Phone", "Phone"],
  ["Extension", "Extn"],
];

// portal display switches (showStudentInfo, showFrontLine504URL, the "Detail"
// type tag) ride along in the payload but aren't information about the student
function isDisplayFlag(key: string): boolean {
  const name = key.replace(/^[@_]+/, "");
  return /^show/i.test(name) || /url$/i.test(name) || name === "type";
}

// keys rendered by the curated cards above, so they aren't repeated further down
const HANDLED_KEYS = new Set(
  [
    ...PERSONAL_FIELDS.map(([, key]) => key),
    ...SCHOOL_FIELDS.map(([, key]) => key),
    "Physician",
    "Dentist",
    "Photo",
  ].map((key) => key.toLowerCase()),
);

function InfoCard({
  title,
  rows,
  media,
}: {
  title: string;
  rows: Row[];
  media?: React.ReactNode;
}) {
  if (rows.length === 0) return null;
  return (
    <Card className="pt-5 pb-4 max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {media}
        <div className="divide-y">
          {rows.map((row, i) => (
            <div
              key={`${row.label}-${i}`}
              className="py-3 flex items-start justify-between gap-6"
            >
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {row.label}
              </span>
              <span className="text-sm font-medium text-right break-words whitespace-pre-line min-w-0">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TableCard({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <Card className="pt-5 pb-4 max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                {headers.map((header, i) => (
                  <th key={`${header}-${i}`} className="py-2 font-normal">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="py-2 pr-4 font-medium">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="pt-5 pb-4 max-w-2xl">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-3 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-44" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// portal media needs the Synergy session cookie, so it comes back through our
// proxy as bytes and gets handed to the browser as an object URL
function usePortalAsset(path: string | undefined): string {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const creds = getStoredCredentials();
    if (!path || !creds) return;
    let objectUrl = "";
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/synergy/student/asset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...creds, path }),
        });
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {}
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);
  return url;
}

export default function AccountPage() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [info, setInfo] = useState<StudentInfo | null>(null);
  const [sections, setSections] = useState<StudentPageSection[]>([]);
  const [meta, setMeta] = useState<StudentPageMeta | null>(null);
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

    (async () => {
      const [accountResult, infoResult, detailsResult] =
        await Promise.allSettled([
          synergyPost<AccountData>("/api/synergy/account", creds),
          synergyPost<StudentInfo>("/api/synergy/student", creds),
          synergyPost<{
            sections?: StudentPageSection[];
            meta?: StudentPageMeta;
          }>("/api/synergy/student/details", creds),
        ]);

      if (accountResult.status === "fulfilled") setAccount(accountResult.value);
      if (detailsResult.status === "fulfilled") {
        setSections(detailsResult.value?.sections ?? []);
        setMeta(detailsResult.value?.meta ?? null);
      }
      if (infoResult.status === "fulfilled") {
        const flat = unwrapStudentInfo(infoResult.value);
        setInfo(flat);
        const photo = field(flat, "Photo");
        if (photo) {
          setPhotoBase64(photo);
          try {
            localStorage.setItem("Student.studentPhoto", photo);
          } catch {}
        }
        const currentSchool = field(flat, "CurrentSchool");
        if (currentSchool) setSchool(currentSchool);
      }

      if (
        accountResult.status === "rejected" &&
        infoResult.status === "rejected"
      ) {
        setError((accountResult.reason as Error).message);
      }
      setLoading(false);
    })();
  }, []);

  const pronunciationUrl = usePortalAsset(meta?.namePronunciationPath);
  const schoolLogoUrl = usePortalAsset(meta?.schoolLogoPath);

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  const name =
    htmlToLines(account?.name) ||
    (info ? htmlToLines(field(info, "FormattedName")) : null);
  const userID =
    htmlToLines(account?.userID) ||
    (info ? htmlToLines(field(info, "PermID")) : null);
  const email =
    htmlToLines(account?.email) ||
    (info ? htmlToLines(field(info, "EMail")) : null);
  const homeAddress = htmlToLines(account?.homeAddress);
  const mailAddress = htmlToLines(account?.mailAddress);

  const addressRows: Row[] = [];
  if (homeAddress)
    addressRows.push({ label: "Home Address", value: homeAddress });
  if (mailAddress)
    addressRows.push({ label: "Mailing Address", value: mailAddress });

  const personalRows = info ? rowsFor(info, PERSONAL_FIELDS) : [];
  const schoolRows = info ? rowsFor(info, SCHOOL_FIELDS) : [];
  const physicianRows = info
    ? contactRows(info.Physician, PROVIDER_FIELDS)
    : [];
  const dentistRows = info ? contactRows(info.Dentist, PROVIDER_FIELDS) : [];

  // anything the district returned that isn't covered above
  const otherRows: Row[] = [];
  const extraCards: { title: string; rows: Row[] }[] = [];
  if (info) {
    for (const [key, value] of Object.entries(info)) {
      if (HANDLED_KEYS.has(key.replace(/^[@_]+/, "").toLowerCase())) continue;
      if (isDisplayFlag(key)) continue;
      if (value == null || value === "") continue;
      if (typeof value === "object") {
        const rows: Row[] = [];
        flatten(value, [], rows);
        if (rows.length) extraCards.push({ title: prettyKey(key), rows });
      } else {
        const rows: Row[] = [];
        flatten(value, [prettyKey(key)], rows);
        otherRows.push(...rows);
      }
    }
  }

  const metaRows: Row[] = [];
  if (meta) {
    if (meta.district)
      metaRows.push({ label: "District", value: meta.district });
    if (meta.school) metaRows.push({ label: "School", value: meta.school });
    if (meta.schoolPhone)
      metaRows.push({ label: "School Phone", value: meta.schoolPhone });
    if (meta.fullName)
      metaRows.push({ label: "Full Name", value: meta.fullName });
    if (meta.studentId)
      metaRows.push({ label: "Student ID", value: meta.studentId });
    if (meta.modules.length)
      metaRows.push({
        label: "Portal Modules",
        value: meta.modules.join(", "),
      });
  }

  const hasSections = sections.length > 0;

  const noInfo =
    !loading &&
    !hasSections &&
    metaRows.length === 0 &&
    personalRows.length === 0 &&
    schoolRows.length === 0 &&
    physicianRows.length === 0 &&
    dentistRows.length === 0 &&
    addressRows.length === 0 &&
    otherRows.length === 0 &&
    extraCards.length === 0;

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
                className="rounded-full h-20 w-20 aspect-square object-cover border"
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
                {school && <p className="text-sm font-medium">{school}</p>}
                {userID && email && (
                  <p className="text-xs text-muted-foreground">
                    {email} - <span className="mb-0">{userID}</span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {loading ? (
          <>
            <LoadingCard />
            <LoadingCard />
          </>
        ) : noInfo ? (
          <Card className="pt-5 pb-4 max-w-2xl">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Your district didn&apos;t return any student information.
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <InfoCard
              title="District & School"
              rows={metaRows}
              media={
                schoolLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={schoolLogoUrl}
                    alt=""
                    className="h-10 w-auto mb-3 object-contain"
                  />
                ) : null
              }
            />
            {pronunciationUrl && (
              <Card className="pt-5 pb-4 max-w-2xl">
                <CardHeader>
                  <CardTitle>Name Pronunciation</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls src={pronunciationUrl} className="w-full" />
                </CardContent>
              </Card>
            )}
            {sections.map((section) =>
              section.table ? (
                <TableCard
                  key={section.title}
                  title={section.title}
                  headers={section.table.headers}
                  rows={section.table.rows}
                />
              ) : (
                <InfoCard
                  key={section.title}
                  title={section.title}
                  rows={section.fields}
                />
              ),
            )}
            {!hasSections && <InfoCard title="Personal" rows={personalRows} />}
            {!hasSections && <InfoCard title="School" rows={schoolRows} />}
            <InfoCard title="Addresses" rows={addressRows} />
            <InfoCard title="Physician" rows={physicianRows} />
            <InfoCard title="Dentist" rows={dentistRows} />
            {extraCards.map((card) => (
              <InfoCard key={card.title} title={card.title} rows={card.rows} />
            ))}
            <InfoCard title="Other Information" rows={otherRows} />
          </>
        )}
      </div>
    </>
  );
}

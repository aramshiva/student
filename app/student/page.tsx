"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RawMessagesResponse {
  data?: {
    PXPMessagesData?: {
      "@SupportingSynergyMail"?: boolean;
      MessageListings?: unknown;
      SynergyMailMessageListingByStudents?: {
        SynergyMailMessageListingByStudent?: {
          "@StudentGU"?: string;
          SynergyMailMessageListings?: {
            SynergyMailMessageListing?: MessageListing | MessageListing[];
          };
        };
      };
    };
  };
  success?: boolean;
}

interface MessageListing {
  "@BeginDate"?: string; // may include time or be date only
  "@Deletable"?: boolean | string;
  "@IconURL"?: string;
  "@Module"?: string; // Attendance, ReportCard, etc.
  "@Read"?: boolean | string;
  "@Subject"?: string;
  "@SubjectNoHTML"?: string;
  "@Type"?: string; // StudentActivity etc.
  AttachmentDatas?: Record<string, unknown>;
}

interface ParsedMessage {
  id: string;
  subject: string;
  date: string;
  module: string;
  read: boolean;
  type: string;
}

function greetingForNow(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Good Night";
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  if (h < 21) return "Good Evening";
  return "Good Night";
}

export default function StudentDashboard() {
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [photoBase64, setPhotoBase64] = useState("");
  const [permId, setPermId] = useState("");
  // studentInfo state removed (not used in render)

  useEffect(() => {
    const credsRaw = localStorage.getItem("studentvue-creds");
    if (!credsRaw) {
      window.location.href = "/";
      return;
    }
    const creds = JSON.parse(credsRaw);
    setLoading(true);
    setError(null);
    // Fetch student info first
    fetch("https://studentvue.aram.sh/student_info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const info = data?.data?.StudentInfo;
  // setStudentInfo removed
        // Extract and store photo, permId
        let photo = "";
        let perm = "";
        let school = "";
        if (info) {
          if (info.Photo && typeof info.Photo === "object" && "$" in info.Photo) {
            photo = String(info.Photo["$"] ?? "");
            setPhotoBase64(photo);
            if (typeof window !== "undefined") {
              localStorage.setItem("studentPhoto", photo);
            }
          }
          if (info.PermID && typeof info.PermID === "object" && "$" in info.PermID) {
            perm = String(info.PermID["$"] ?? "");
            setPermId(perm);
            if (typeof window !== "undefined") {
              localStorage.setItem("studentPermId", perm);
            }
          }
          if (info.CurrentSchool) {
            if (typeof info.CurrentSchool === "object" && info.CurrentSchool !== null && "$" in info.CurrentSchool) {
              school = String(info.CurrentSchool["$"]);
            } else {
              school = String(info.CurrentSchool ?? "");
            }
            if (typeof window !== "undefined") {
              localStorage.setItem("studentSchool", school);
            }
          }
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        // Fetch messages after student info
        fetch(`https://${process.env.NEXT_PUBLIC_APIVUE_SERVER_URL}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds),
        })
          .then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
          .then((json: RawMessagesResponse) => {
            const listings =
              json?.data?.PXPMessagesData?.SynergyMailMessageListingByStudents
                ?.SynergyMailMessageListingByStudent?.SynergyMailMessageListings
                ?.SynergyMailMessageListing;
            if (!listings) {
              setMessages([]);
              return;
            }
            const arr: MessageListing[] = Array.isArray(listings)
              ? listings
              : [listings];
            const parsed: ParsedMessage[] = arr.map((m, idx) => {
              const rawDate = m["@BeginDate"] || "";
              let dateStr = rawDate;
              try {
                if (rawDate) {
                  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate)) {
                    const [mm, dd, yyyy] = rawDate.split("/").map(Number);
                    dateStr = new Date(
                      yyyy,
                      (mm || 1) - 1,
                      dd || 1
                    ).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    });
                  } else {
                    const d = new Date(rawDate.replace(" 00:00:00", ""));
                    if (!isNaN(d.getTime())) {
                      dateStr = d.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      });
                    }
                  }
                }
              } catch {}
              const subj = m["@SubjectNoHTML"] || m["@Subject"] || "(No Subject)";
              return {
                id: `${idx}-${subj.slice(0, 20)}`,
                subject: subj,
                date: dateStr,
                module: m["@Module"] || "",
                read:
                  typeof m["@Read"] === "string"
                    ? m["@Read"] === "true"
                    : !!m["@Read"],
                type: m["@Type"] || "",
              };
            });
            parsed.sort((a, b) => {
              const ad = new Date(
                arr[parsed.indexOf(a)]?.["@BeginDate"] || 0
              ).getTime();
              const bd = new Date(
                arr[parsed.indexOf(b)]?.["@BeginDate"] || 0
              ).getTime();
              return bd - ad;
            });
            setMessages(parsed);
          })
          .catch((e) => setError(e.message))
          .finally(() => setLoading(false));
      });
  }, []);

  const greeting = greetingForNow();

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-center gap-8">
        {photoBase64 && (
          <Image
            src={`data:image/png;base64,${photoBase64}`}
            alt="Student Photo"
            width={80}
            height={80}
            className="rounded-full h-[5.5rem] w-[5.5rem] aspect-square object-cover border"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold">
            {greeting}
            {permId ? `, ${permId}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here are your recent activity messages.
          </p>
          {/* Optionally render more student info fields here if desired */}
        </div>
      </div>

      <Card className="px-2 py-5">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            {loading ? "Refreshing..." : "Messages posted by your school"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!error && !loading && !messages.length && (
            <div className="text-sm text-muted-foreground">No messages.</div>
          )}
          <ul className="divide-y">
            {messages.map((m) => (
              <li key={m.id} className="py-3 flex items-start gap-3">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={m.read ? "default" : "outline"}>
                      {m.module}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                      {m.date}
                    </span>
                  </div>
                  <p
                    className={`text-sm mt-1 truncate ${
                      !m.read ? "font-medium" : ""
                    }`}
                    title={m.subject}
                  >
                    {m.subject}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

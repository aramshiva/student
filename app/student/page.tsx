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

interface NewStudentInfoRoot {
  FormattedName?: string;
  PermID?: number | string;
  Gender?: string;
  Grade?: number | string;
  Address?: string;
  LastNameGoesBy?: string;
  NickName?: string;
  BirthDate?: string;
  EMail?: string;
  Phone?: string;
  HomeLanguage?: string;
  CurrentSchool?: string;
  Track?: string;
  HomeRoomTch?: string;
  HomeRoomTchEMail?: string;
  HomeRoomTchStaffGU?: string;
  OrgYearGU?: string;
  HomeRoom?: string;
  CounselorName?: string;
  CounselorEmail?: string;
  CounselorStaffGU?: string;
  Photo?: string; // base64 png
  Physician?: {
    _Name?: string;
    _Hospital?: string;
    _Phone?: string;
    _Extn?: string;
  };
  Dentist?: {
    _Name?: string;
    _Office?: string;
    _Phone?: string;
    _Extn?: string;
  };
  _Type?: string;
  _ShowStudentInfo?: string | boolean;
}

interface LegacyStudentInfoWrapper {
  data?: {
    StudentInfo?: Record<string, unknown>;
  };
}

interface PXPMessagesApiResponse {
  PXPMessagesData?: {
    _SupportingSynergyMail?: string | boolean;
    MessageListings?: unknown;
    SynergyMailMessageListingByStudents?: {
      SynergyMailMessageListingByStudent?: {
        _StudentGU?: string;
        SynergyMailMessageListings?: {
          SynergyMailMessageListing?: MessageListing | MessageListing[];
        };
      };
    };
  };
}

interface MessageListing {
  _BeginDate?: string;
  _Deletable?: string | boolean;
  _IconURL?: string;
  _Module?: string;
  _Read?: string | boolean;
  _Subject?: string;
  _SubjectNoHTML?: string;
  _Type?: string;
  AttachmentDatas?: unknown;
}
interface ParsedMessage {
  id: string;
  subject: string;
  date: string;
  module: string;
  read: boolean;
  type: string;
}

interface TodayScheduleClass {
  period: number;
  className: string;
  room: string;
  teacher: string;
  start?: string;
  end?: string;
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
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleClass[]>([]);
  const [todayScheduleError, setTodayScheduleError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const credsRaw = localStorage.getItem("studentvue-creds");
      if (!credsRaw) {
        window.location.href = "/";
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const creds = JSON.parse(credsRaw);
        const studentInfoReq = fetch("/api/synergy/student_info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds),
        });
        const messagesReq = fetch("/api/synergy/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: credsRaw,
        });
        const scheduleReq = fetch("/api/synergy/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: credsRaw,
        });
        const [infoRes, messagesRes, scheduleRes] = await Promise.all([
          studentInfoReq,
          messagesReq,
          scheduleReq,
        ]);
        if (!infoRes.ok) throw new Error(`Student info HTTP ${infoRes.status}`);
        if (!messagesRes.ok)
          throw new Error(`Messages HTTP ${messagesRes.status}`);
        const infoJson: NewStudentInfoRoot | LegacyStudentInfoWrapper =
          await infoRes.json();
        let flat: NewStudentInfoRoot | undefined;
        if (infoJson && "PermID" in infoJson) {
          flat = infoJson as NewStudentInfoRoot;
        } else if ((infoJson as LegacyStudentInfoWrapper)?.data?.StudentInfo) {
          const legacy =
            (infoJson as LegacyStudentInfoWrapper).data?.StudentInfo ?? {};
          type DollarObj = { $?: unknown };
          const hasDollar = (o: unknown): o is DollarObj =>
            !!o &&
            typeof o === "object" &&
            "$" in (o as Record<string, unknown>);
          const pull = (v: unknown): string => {
            if (hasDollar(v)) return String(v.$ ?? "");
            return v == null ? "" : String(v);
          };
          flat = {
            PermID: pull(legacy.PermID),
            CurrentSchool: pull(legacy.CurrentSchool),
            Photo: pull(legacy.Photo),
            FormattedName: pull(legacy.FormattedName),
            Grade: pull(legacy.Grade),
          };
        }
        if (flat) {
          if (flat.Photo) {
            setPhotoBase64(flat.Photo);
            localStorage.setItem("studentPhoto", flat.Photo);
          }
          if (flat.PermID !== undefined) {
            const pid = String(flat.PermID);
            setPermId(pid);
            localStorage.setItem("studentPermId", pid);
          }
          if (flat.CurrentSchool) {
            localStorage.setItem("studentSchool", flat.CurrentSchool);
          }
        }
        const messagesJson: PXPMessagesApiResponse = await messagesRes.json();
        const listingsRaw =
          messagesJson?.PXPMessagesData?.SynergyMailMessageListingByStudents
            ?.SynergyMailMessageListingByStudent?.SynergyMailMessageListings
            ?.SynergyMailMessageListing;
        const list: MessageListing[] = listingsRaw
          ? Array.isArray(listingsRaw)
            ? listingsRaw
            : [listingsRaw]
          : [];
        if (!list.length) {
          setMessages([]);
          return;
        }
        const parseDate = (raw?: string): string => {
          if (!raw) return "";
          const cleaned = raw.replace(/ 00:00:00$/, "");
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
            const [mm, dd, yyyy] = cleaned.split("/").map(Number);
            const d = new Date(yyyy, (mm || 1) - 1, dd || 1);
            if (!isNaN(d.getTime()))
              return d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
          }
          const d2 = new Date(cleaned);
          if (!isNaN(d2.getTime()))
            return d2.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
          return raw;
        };
        const parsed: ParsedMessage[] = list.map((m, i) => {
          const subj = m._SubjectNoHTML || m._Subject || "(No Subject)";
          return {
            id: `${i}-${subj.slice(0, 24)}`,
            subject: subj,
            date: parseDate(m._BeginDate),
            module: m._Module || "",
            read: typeof m._Read === "string" ? m._Read === "true" : !!m._Read,
            type: m._Type || "",
          };
        });
        parsed.sort((a, b) => {
          const findRaw = (pm: ParsedMessage) =>
            list[parsed.indexOf(pm)]?._BeginDate || "";
          const ad = new Date(findRaw(a).replace(/ 00:00:00$/, "")).getTime();
          const bd = new Date(findRaw(b).replace(/ 00:00:00$/, "")).getTime();
          return bd - ad;
        });
        setMessages(parsed);

        if (!scheduleRes.ok) {
          setTodayScheduleError(`Schedule HTTP ${scheduleRes.status}`);
        } else {
          const schedJson = await scheduleRes.json();
          const scheduleRoot =
            schedJson?.StudentClassSchedule ?? schedJson?.StudentClassList ?? schedJson;
          const normalize = <T,>(v: T | T[] | undefined | null): T[] =>
            !v ? [] : Array.isArray(v) ? v : [v];
          const todayClassesRaw = normalize(
            scheduleRoot?.TodayScheduleInfoData?.SchoolInfos?.SchoolInfo?.Classes?.ClassInfo,
          );

          if (todayClassesRaw.length) {
            const mapped: TodayScheduleClass[] = todayClassesRaw
              .map(
                (c: {
                  _Period?: string;
                  _ClassName?: string;
                  _RoomName?: string;
                  _TeacherName?: string;
                  _TeacherEmail?: string;
                  _StartTime?: string;
                  _EndTime?: string;
                }) => ({
                  period: Number(c._Period || 0),
                  className: c._ClassName || "",
                  room: c._RoomName || "",
                  teacher: c._TeacherName || "",
                  start: c._StartTime,
                  end: c._EndTime,
                }),
              )
              .filter((c) => !!c.className) // filter out any empty placeholders
              .sort((a, b) => a.period - b.period);
            setTodaySchedule(mapped);
          } else {
            setTodaySchedule([]);
          }
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
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
          <h1 className="text-2xl font-medium">
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

      <Card className="px-2 py-5">
        <CardHeader>
          <CardTitle>Your schedule for today</CardTitle>
          <CardDescription>
            {todayScheduleError
              ? todayScheduleError
              : todaySchedule.length
              ? `Showing ${todaySchedule.length} classes`
              : loading
              ? "Loading..."
              : "No classes found for today"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaySchedule.length > 0 && (
            <ul className="divide-y text-sm">
              {todaySchedule.map((c) => (
                <li key={c.period} className="py-2 flex items-center gap-4">
                  <span className="w-8 text-xs text-gray-600">
                    {c.period.toString().padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={c.className}>{c.className}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.teacher}{c.room ? ` • Rm ${c.room}` : ""}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground w-24 text-right">
                    {c.start && c.end ? (
                      <>
                        {c.start} –<br />
                        {c.end}
                      </>
                    ) : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Marks from "@/components/Marks";
import { Course } from "@/types/gradebook";
import { loadGradebookCache, loadCacheDuration } from "@/utils/gradebook";
import { getStoredCredentials, postJson, synergyPost } from "@/lib/clientApi";

const DASHBOARD_CACHE_KEY = "Student.dashboardCache";

interface DashboardCache {
  messages: ParsedMessage[];
  todaySchedule: TodayScheduleClass[];
  photoBase64: string;
  permId: string;
  studentName: string;
  temp: number | null;
  tempUnit: TempUnit;
  gradeCourses: Course[];
  timestamp: number;
}

function loadDashboardCache(): DashboardCache | null {
  try {
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DashboardCache;
  } catch {
    return null;
  }
}

function saveDashboardCache(data: Omit<DashboardCache, "timestamp">) {
  try {
    localStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify({ ...data, timestamp: Date.now() }),
    );
  } catch {}
}

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

interface WeatherData {
  current: {
    temp: number;
    condition: string;
    windSpeed: number;
    precipitation: number;
  };
}

type TempUnit = "fahrenheit" | "celsius" | "kelvin";

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
  const [studentName, setStudentName] = useState("");
  const [gradeCourses, setGradeCourses] = useState<Course[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleClass[]>([]);
  const [todayScheduleError, setTodayScheduleError] = useState<string | null>(
    null,
  );
  const [temp, setTemp] = useState<number | null>(null);
  const [tempUnit, setTempUnit] = useState<TempUnit>(() => {
    if (typeof window === "undefined") return "fahrenheit";
    const stored = localStorage.getItem("tempUnit");
    if (
      stored === "celsius" ||
      stored === "fahrenheit" ||
      stored === "kelvin"
    ) {
      return stored;
    }
    return localStorage.getItem("celsius") === "1" ? "celsius" : "fahrenheit";
  });

  const resolveTempUnit = (): TempUnit => {
    const stored = localStorage.getItem("tempUnit");
    if (
      stored === "celsius" ||
      stored === "fahrenheit" ||
      stored === "kelvin"
    ) {
      return stored;
    }
    return localStorage.getItem("celsius") === "1" ? "celsius" : "fahrenheit";
  };
  useEffect(() => {
    (async () => {
      const creds = getStoredCredentials();
      if (!creds) {
        window.location.href = "/login";
        return;
      }

      const cacheDurationMs = loadCacheDuration() * 60 * 1000;
      if (cacheDurationMs > 0) {
        const cached = loadDashboardCache();
        if (cached && Date.now() - cached.timestamp < cacheDurationMs) {
          setMessages(cached.messages);
          setTodaySchedule(cached.todaySchedule);
          setPhotoBase64(cached.photoBase64);
          setPermId(cached.permId);
          setStudentName(cached.studentName);
          setTemp(cached.temp);
          setTempUnit(cached.tempUnit);
          setGradeCourses(cached.gradeCourses ?? []);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);
      try {
        let newGradeCourses: Course[] = [];

        // Load gradebook from its own cache or API
        try {
          type GradebookLike = {
            Gradebook?: { Courses?: { Course?: Course[] } };
            Courses?: { Course?: Course[] };
          };
          const gbCached = loadGradebookCache(null);
          const gbFresh =
            cacheDurationMs > 0 &&
            gbCached != null &&
            Date.now() - gbCached.timestamp < cacheDurationMs;
          let gbData: GradebookLike | null = gbFresh
            ? (gbCached!.data as GradebookLike)
            : null;
          if (!gbData) {
            gbData = await synergyPost<GradebookLike>(
              "/api/synergy/gradebook",
              creds,
            );
          }
          if (gbData) {
            const root = gbData.Gradebook ?? gbData;
            newGradeCourses = root?.Courses?.Course || [];
            setGradeCourses(newGradeCourses);
          }
        } catch {}

        const [infoResult, messagesResult, scheduleResult] =
          await Promise.allSettled([
            synergyPost<NewStudentInfoRoot | LegacyStudentInfoWrapper>(
              "/api/synergy/student",
              creds,
            ),
            synergyPost<PXPMessagesApiResponse>(
              "/api/synergy/messages",
              creds,
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            synergyPost<any>("/api/synergy/schedule", creds),
          ]);
        if (infoResult.status === "rejected") throw infoResult.reason;
        if (messagesResult.status === "rejected") throw messagesResult.reason;
        const infoJson = infoResult.value;
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
        let newPhoto = "";
        let newPermId = "";
        if (flat) {
          if (flat.Photo) {
            newPhoto = flat.Photo;
            setPhotoBase64(flat.Photo);
            localStorage.setItem("Student.studentPhoto", flat.Photo);
          }
          if (flat.PermID !== undefined) {
            newPermId = String(flat.PermID);
            setPermId(newPermId);
            localStorage.setItem("Student.studentPermId", newPermId);
          }
          if (flat.CurrentSchool) {
            localStorage.setItem("Student.studentSchool", flat.CurrentSchool);
          }
        }

        let newName = "";
        const cachedName = localStorage.getItem("Student.studentName");
        if (cachedName && cachedName.trim()) {
          newName = cachedName.trim();
          setStudentName(newName);
        } else {
          try {
            const nameJson = await synergyPost<{ name?: string }>(
              "/api/synergy/student/name",
              creds,
            );
            if (typeof nameJson?.name === "string" && nameJson.name.trim()) {
              newName = nameJson.name.trim();
              setStudentName(newName);
              localStorage.setItem("Student.studentName", newName);
            }
          } catch {}
        }

        const messagesJson = messagesResult.value;
        const listingsRaw =
          messagesJson?.PXPMessagesData?.SynergyMailMessageListingByStudents
            ?.SynergyMailMessageListingByStudent?.SynergyMailMessageListings
            ?.SynergyMailMessageListing;
        const list: MessageListing[] = listingsRaw
          ? Array.isArray(listingsRaw)
            ? listingsRaw
            : [listingsRaw]
          : [];
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

        let newSchedule: TodayScheduleClass[] = [];
        if (scheduleResult.status === "rejected") {
          const reason = scheduleResult.reason;
          setTodayScheduleError(
            reason instanceof Error ? reason.message : "Failed to load schedule",
          );
        } else {
          const schedJson = scheduleResult.value;
          const scheduleRoot =
            schedJson?.StudentClassSchedule ??
            schedJson?.StudentClassList ??
            schedJson;
          const normalize = <T,>(v: T | T[] | undefined | null): T[] =>
            !v ? [] : Array.isArray(v) ? v : [v];
          const todayClassesRaw = normalize(
            scheduleRoot?.TodayScheduleInfoData?.SchoolInfos?.SchoolInfo
              ?.Classes?.ClassInfo,
          );
          if (todayClassesRaw.length) {
            newSchedule = todayClassesRaw
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
              .filter((c: TodayScheduleClass) => !!c.className)
              .sort(
                (a: TodayScheduleClass, b: TodayScheduleClass) =>
                  a.period - b.period,
              );
          }
          setTodaySchedule(newSchedule);
        }

        let newTemp: number | null = null;
        let newTempUnit = resolveTempUnit();
        try {
          const zip = localStorage.getItem("Student.zip") || "98028";
          setTempUnit(newTempUnit);
          const weatherJson = await postJson<WeatherData>("/api/weather", {
            zip,
          });
          if (weatherJson?.current?.temp) {
            const tempC = weatherJson.current.temp;
            newTemp =
              newTempUnit === "celsius"
                ? Math.round(tempC)
                : newTempUnit === "kelvin"
                  ? Math.round(tempC + 273.15)
                  : Math.round((tempC * 9) / 5 + 32);
            setTemp(newTemp);
          }
        } catch {}

        if (cacheDurationMs > 0) {
          saveDashboardCache({
            messages: parsed,
            todaySchedule: newSchedule,
            photoBase64: newPhoto,
            permId: newPermId,
            studentName: newName,
            temp: newTemp,
            tempUnit: newTempUnit,
            gradeCourses: newGradeCourses,
          });
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
    <div className="p-8 space-y-5 min-h-screen dark:bg-zinc-900 bg-gradient-to-tl from-primary/10 via-transparent backdrop-blur-sm">
      <div className="flex items-center gap-8">
        {photoBase64 && (
          <Image
            src={`data:image/png;base64,${photoBase64}`}
            alt="Student Photo"
            width={80}
            height={80}
            className="rounded-full h-22 w-22 aspect-square object-cover border"
          />
        )}
        <div>
          <h1 className="text-2xl font-medium font-[Montreal,sans]">
            {greeting}
            {studentName ? `, ${studentName}` : permId ? `, ${permId}` : ""}.
            {temp
              ? ` It's ${temp}${
                  tempUnit === "kelvin"
                    ? "K"
                    : tempUnit === "celsius"
                      ? "°C"
                      : "°F"
                } outside`
              : ""}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Here are your recent activity messages.
          </p>
        </div>
      </div>

      {gradeCourses.length > 0 && (
        <Card className="pt-5 pb-4">
          <CardHeader>
            <CardTitle>Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <Marks courses={gradeCourses} />
          </CardContent>
        </Card>
      )}

      <Card className="pt-5 pb-4">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
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
                    className={`text-sm mt-1 ${!m.read ? "font-medium" : ""}`}
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
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {todaySchedule.length > 0 && (
            <ul className="divide-y text-sm">
              {todaySchedule.map((c) => (
                <li key={c.period} className="py-2 flex items-center gap-4">
                  <span className="w-8 text-xs text-zinc-500">
                    {c.period.toString().padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={c.className}>
                      {c.className}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.teacher}
                      {c.room ? ` • Rm ${c.room}` : ""}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground w-24 text-right">
                    {c.start && c.end ? (
                      <>
                        {c.start} –<br />
                        {c.end}
                      </>
                    ) : (
                      ""
                    )}
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

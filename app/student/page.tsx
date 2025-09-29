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
  useEffect(() => {
    (async () => {
      const credsRaw = localStorage.getItem("studentvue-creds");
      if (!credsRaw) { window.location.href = "/"; return; }
      setLoading(true); setError(null);
      try {
        const creds = JSON.parse(credsRaw);
        const studentInfoReq = fetch("https://studentvue.aram.sh/student_info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(creds) });
        const messagesReq = fetch("/api/synergy/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: credsRaw });
        const [infoRes, messagesRes] = await Promise.all([studentInfoReq, messagesReq]);
        if (!infoRes.ok) throw new Error(`Student info HTTP ${infoRes.status}`);
        if (!messagesRes.ok) throw new Error(`Messages HTTP ${messagesRes.status}`);
        const infoJson = await infoRes.json();
        const info = infoJson?.data?.StudentInfo;
        if (info) {
          if (info.Photo && typeof info.Photo === "object" && "$" in info.Photo) {
            const p = String(info.Photo["$"] ?? ""); setPhotoBase64(p); localStorage.setItem("studentPhoto", p);
          }
          if (info.PermID && typeof info.PermID === "object" && "$" in info.PermID) {
            const pid = String(info.PermID["$"] ?? ""); setPermId(pid); localStorage.setItem("studentPermId", pid);
          }
          if (info.CurrentSchool) {
            let school = ""; if (typeof info.CurrentSchool === "object" && info.CurrentSchool !== null && "$" in info.CurrentSchool) school = String(info.CurrentSchool["$"]); else school = String(info.CurrentSchool ?? ""); localStorage.setItem("studentSchool", school);
          }
        }
        const messagesJson: PXPMessagesApiResponse = await messagesRes.json();
        const listingsRaw = messagesJson?.PXPMessagesData?.SynergyMailMessageListingByStudents?.SynergyMailMessageListingByStudent?.SynergyMailMessageListings?.SynergyMailMessageListing;
        const list: MessageListing[] = listingsRaw ? (Array.isArray(listingsRaw) ? listingsRaw : [listingsRaw]) : [];
        if (!list.length) { setMessages([]); return; }
        const parseDate = (raw?: string): string => {
          if (!raw) return ""; const cleaned = raw.replace(/ 00:00:00$/, "");
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) { const [mm, dd, yyyy] = cleaned.split("/").map(Number); const d = new Date(yyyy, (mm||1)-1, dd||1); if (!isNaN(d.getTime())) return d.toLocaleDateString(undefined,{month:"short",day:"numeric"}); }
          const d2 = new Date(cleaned); if (!isNaN(d2.getTime())) return d2.toLocaleDateString(undefined,{month:"short",day:"numeric"});
          return raw;
        };
        const parsed: ParsedMessage[] = list.map((m,i) => { const subj = m._SubjectNoHTML || m._Subject || "(No Subject)"; return { id: `${i}-${subj.slice(0,24)}`, subject: subj, date: parseDate(m._BeginDate), module: m._Module || "", read: typeof m._Read === "string" ? m._Read === "true" : !!m._Read, type: m._Type || "" }; });
        parsed.sort((a,b)=>{ const findRaw = (pm: ParsedMessage) => list[parsed.indexOf(pm)]?._BeginDate || ""; const ad = new Date(findRaw(a).replace(/ 00:00:00$/, "")).getTime(); const bd = new Date(findRaw(b).replace(/ 00:00:00$/, "")).getTime(); return bd - ad; });
        setMessages(parsed);
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
    </div>
  );
}

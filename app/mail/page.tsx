"use client";
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface MailRecipient {
  _RecipientType?: string;
  _GU?: string;
  _RecipientList?: string;
  _GroupUserTypes?: string;
  _Details1?: string;
  _Details2?: string;
}

interface MailMessage {
  From?: { RecipientXML?: MailRecipient | MailRecipient[] };
  To?: string | Record<string, unknown> | null;
  CC?: string | Record<string, unknown> | null;
  BCC?: string | Record<string, unknown> | null;
  Attachments?: {
    AttachmentXML?: { _FileName?: string; _FileSize?: string }[];
  } | null;
  _SMMessageGU?: string;
  _SMMsgPersonGU?: string;
  _SendDateTime?: string;
  _Subject?: string;
  _MessageText?: string;
}

export default function MailPage() {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MailMessage | null>(null);

  useEffect(() => {
    const credsRaw = localStorage.getItem("studentvue-creds");
    if (!credsRaw) {
      window.location.href = "/";
      return;
    }
    const creds = JSON.parse(credsRaw);
    setLoading(true);
    fetch("/api/synergy/mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        district_url: creds.district_url,
        username: creds.username,
        password: creds.password,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const inbox = json?.InboxItemListings?.MessageXML || [];
        setMessages(Array.isArray(inbox) ? inbox : [inbox]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dt?: string) => {
    if (!dt) return "";
    const [datePart, timePart] = dt.split(" ");
    if (!datePart) return dt;
    const [m, d, y] = datePart.split("/").map(Number);
    const iso = new Date(
      y,
      (m || 1) - 1,
      d || 1,
      ...(timePart ? timePart.split(":").map(Number) : []),
    );
    return iso.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <div className="p-8">Loading mail...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Mail</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 md:col-span-1 max-h-[70vh] overflow-auto">
          <h2 className="font-medium mb-3 text-sm text-muted-foreground">
            Inbox ({messages.length})
          </h2>
          {!messages.length && (
            <div className="text-xs text-muted-foreground">No messages.</div>
          )}
          <ul className="space-y-1">
            {messages.map((m) => {
              const sender = Array.isArray(m.From?.RecipientXML)
                ? m.From?.RecipientXML[0]
                : m.From?.RecipientXML;
              return (
                <li key={m._SMMessageGU}>
                  <button
                    onClick={() => setSelected(m)}
                    className={`w-full text-left rounded px-2 py-2 border hover:bg-muted/40 transition text-sm ${selected?._SMMessageGU === m._SMMessageGU ? "bg-muted/60" : ""}`}
                  >
                    <div className="font-medium line-clamp-1">
                      {m._Subject || "(No Subject)"}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {sender?._Details1 || "Unknown"} •{" "}
                      {formatDate(m._SendDateTime)}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-4 md:col-span-2 max-h-[70vh] overflow-auto">
          {!selected ? (
            <div className="text-muted-foreground text-sm">
              Select a message to view.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold break-words">
                  {selected._Subject || "(No Subject)"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  From:{" "}
                  {(() => {
                    const s = Array.isArray(selected.From?.RecipientXML)
                      ? selected.From?.RecipientXML[0]
                      : selected.From?.RecipientXML;
                    return s?._Details1 || "Unknown";
                  })()}{" "}
                  • {formatDate(selected._SendDateTime)}
                </p>
              </div>
              <div
                className="prose max-w-none text-sm"
                dangerouslySetInnerHTML={{
                  __html: selected._MessageText || "<p>(No content)</p>",
                }}
              />
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}

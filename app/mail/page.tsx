"use client";
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [deletedMessages, setDeletedMessages] = useState<Set<string>>(
    new Set(),
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const deletedRaw = localStorage.getItem("Student.deletedMails");
    if (deletedRaw) {
      try {
        const deletedArray = JSON.parse(deletedRaw);
        setDeletedMessages(new Set(deletedArray));
      } catch (e) {
        console.error("Failed to parse deleted messages:", e);
      }
    }

    const credsRaw = localStorage.getItem("Student.creds");
    if (!credsRaw) {
      window.location.href = "/login";
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

  const handleDeleteSingle = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    setIsDeleting(true);
    try {
      const newDeletedMessages = new Set(deletedMessages);
      newDeletedMessages.add(messageId);
      setDeletedMessages(newDeletedMessages);

      localStorage.setItem(
        "Student.deletedMails",
        JSON.stringify([...newDeletedMessages]),
      );

      if (selected?._SMMessageGU === messageId) {
        setSelected(null);
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    const visibleMessages = messages.filter(
      (m) => !deletedMessages.has(m._SMMessageGU || ""),
    );
    if (visibleMessages.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete all ${visibleMessages.length} visible message(s)?`,
      )
    )
      return;

    setIsDeleting(true);
    try {
      const newDeletedMessages = new Set(deletedMessages);
      visibleMessages.forEach((m) => {
        if (m._SMMessageGU) {
          newDeletedMessages.add(m._SMMessageGU);
        }
      });
      setDeletedMessages(newDeletedMessages);

      localStorage.setItem(
        "Student.deletedMails",
        JSON.stringify([...newDeletedMessages]),
      );

      if (selected && newDeletedMessages.has(selected._SMMessageGU || "")) {
        setSelected(null);
      }
    } catch (error) {
      console.error("Failed to delete messages:", error);
      alert("Failed to delete messages");
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 space-y-6 min-h-screen dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {loading ? <Skeleton className="h-7 w-[60px]" /> : "Mail"}
        </h1>
        <div className="flex items-center gap-2">
          {loading ? (
            <>
              <Skeleton className="h-8 w-[150px]" />
              <Skeleton className="h-8 w-[140px]" />
            </>
          ) : (
            <>
              {messages.filter(
                (m) => !deletedMessages.has(m._SMMessageGU || ""),
              ).length > 0 && (
                <Button
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete All Visible
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/mail/deleted")}
              >
                View Deleted ({deletedMessages.size})
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 md:col-span-1 max-h-[70vh] overflow-auto">
          <h2 className="font-medium mb-3 text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-4 w-[100px]" />
            ) : (
              `Inbox (${messages.filter((m) => !deletedMessages.has(m._SMMessageGU || "")).length})`
            )}
          </h2>
          {loading ? (
            <ul className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="rounded px-2 py-2 border">
                  <div className="font-medium mb-1">
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="text-xs">
                    <Skeleton className="h-3 w-[60%]" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <>
              {!messages.length && (
                <div className="text-xs text-muted-foreground">
                  No messages.
                </div>
              )}
              <ul className="space-y-1">
                {messages
                  .filter((m) => !deletedMessages.has(m._SMMessageGU || ""))
                  .map((m) => {
                    const sender = Array.isArray(m.From?.RecipientXML)
                      ? m.From?.RecipientXML[0]
                      : m.From?.RecipientXML;
                    const messageId = m._SMMessageGU || "";
                    return (
                      <li key={m._SMMessageGU} className="group relative">
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
                        <Button
                          onClick={() => handleDeleteSingle(messageId)}
                          disabled={isDeleting}
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
        </Card>

        <Card className="p-4 md:col-span-2 max-h-[70vh] overflow-auto">
          {loading ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  <Skeleton className="h-7 w-full" />
                </h2>
                <p className="text-xs">
                  <Skeleton className="h-3 w-[40%]" />
                </p>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ) : !selected ? (
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

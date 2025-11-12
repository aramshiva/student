"use client";
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";

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

export default function DeletedMailPage() {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MailMessage | null>(null);
  const [deletedMessages, setDeletedMessages] = useState<Set<string>>(
    new Set(),
  );
  const [isRestoring, setIsRestoring] = useState(false);

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

  const handleRestore = async (messageId: string) => {
    if (!confirm("Are you sure you want to restore this message?")) return;

    setIsRestoring(true);
    try {
      const newDeletedMessages = new Set(deletedMessages);
      newDeletedMessages.delete(messageId);
      setDeletedMessages(newDeletedMessages);

      localStorage.setItem(
        "Student.deletedMails",
        JSON.stringify([...newDeletedMessages]),
      );
    } catch (error) {
      console.error("Failed to restore message:", error);
      alert("Failed to restore message");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestoreAll = async () => {
    const deletedMessagesList = messages.filter((m) =>
      deletedMessages.has(m._SMMessageGU || ""),
    );
    if (deletedMessagesList.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to restore all ${deletedMessagesList.length} deleted message(s)?`,
      )
    )
      return;

    setIsRestoring(true);
    try {
      setDeletedMessages(new Set());
      localStorage.removeItem("Student.deletedMails");
      setSelected(null);
    } catch (error) {
      console.error("Failed to restore all messages:", error);
      alert("Failed to restore all messages");
    } finally {
      setIsRestoring(false);
    }
  };

  const deletedMessagesList = messages.filter((m) =>
    deletedMessages.has(m._SMMessageGU || ""),
  );

  if (loading) return <div className="p-8">Loading deleted mail...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/mail")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Mail
          </Button>
          <h1 className="text-xl font-semibold">Deleted Mail</h1>
        </div>
        <div className="flex items-center gap-2">
          {deletedMessagesList.length > 0 && (
            <Button
              onClick={handleRestoreAll}
              disabled={isRestoring}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Restore All ({deletedMessagesList.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 md:col-span-1 max-h-[70vh] overflow-auto">
          <h2 className="font-medium mb-3 text-sm text-muted-foreground">
            Deleted Messages ({deletedMessagesList.length})
          </h2>
          {deletedMessagesList.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No deleted messages.
            </div>
          )}
          <ul className="space-y-1">
            {deletedMessagesList.map((m) => {
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
                    onClick={() => handleRestore(messageId)}
                    disabled={isRestoring}
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-50"
                    title="Restore"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-4 md:col-span-2 max-h-[70vh] overflow-auto">
          {!selected ? (
            <div className="text-muted-foreground text-sm">
              Select a deleted message to view.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
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
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleRestore(selected._SMMessageGU || "")}
                    disabled={isRestoring}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restore
                  </Button>
                </div>
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

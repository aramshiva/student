"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Archive,
  ArchiveRestore,
  Inbox,
  Mail as MailIcon,
  MailOpen,
  Paperclip,
  Reply,
} from "lucide-react";
import {
  getStoredCredentials,
  synergyPost,
  StoredCredentials,
} from "@/lib/clientApi";

interface MailRecipient {
  _RecipientType?: string;
  _GU?: string;
  _RecipientList?: string;
  _GroupUserTypes?: string;
  _Details1?: string;
  _Details2?: string;
}

interface MailAttachment {
  _SmAttachmentGU?: string;
  _DocumentName?: string;
  _FileName?: string;
}

interface MailMessage {
  From?: { RecipientXML?: MailRecipient | MailRecipient[] };
  To?: string | Record<string, unknown> | null;
  CC?: string | Record<string, unknown> | null;
  BCC?: string | Record<string, unknown> | null;
  Attachments?: {
    AttachmentXML?: MailAttachment | MailAttachment[];
  } | null;
  _SMMessageGU?: string;
  _SMMsgPersonGU?: string;
  _SendDateTime?: string;
  _SendDateTimeFormattedShort?: string;
  _Subject?: string;
  _MessageText?: string;
  _MailRead?: string;
  _NoReply?: string;
}

type Folder = "Inbox" | "Archive";

function formatDate(dt?: string) {
  if (!dt) return "";
  const [datePart, timePart] = dt.split(" ");
  if (!datePart) return dt;
  const [m, d, y] = datePart.split("/").map(Number);
  const parsed = new Date(
    y,
    (m || 1) - 1,
    d || 1,
    ...(timePart ? timePart.split(":").map(Number) : []),
  );
  if (isNaN(parsed.getTime())) return dt;
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function senderOf(m: MailMessage): MailRecipient | undefined {
  return Array.isArray(m.From?.RecipientXML)
    ? m.From?.RecipientXML[0]
    : m.From?.RecipientXML;
}

function attachmentsOf(m: MailMessage): MailAttachment[] {
  const raw = m.Attachments?.AttachmentXML;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export default function MailPage() {
  const [creds, setCreds] = useState<StoredCredentials | null>(null);
  const [folder, setFolder] = useState<Folder>("Inbox");
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MailMessage | null>(null);
  const [busy, setBusy] = useState(false);
  // local read/unread overrides until the next refetch: true = unread
  const [unreadOverrides, setUnreadOverrides] = useState<Map<string, boolean>>(
    new Map(),
  );
  const [replyEmail, setReplyEmail] = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    const stored = getStoredCredentials();
    if (!stored) {
      window.location.href = "/login";
      return;
    }
    setCreds(stored);
  }, []);

  const fetchFolder = useCallback(
    async (c: StoredCredentials, f: Folder) => {
      setLoading(true);
      setError(null);
      setSelected(null);
      setReplyEmail(null);
      setUnreadOverrides(new Map());
      try {
        const json = await synergyPost<{ messages?: MailMessage[] }>(
          "/api/synergy/mail",
          c,
          { folder: f },
        );
        setMessages(Array.isArray(json?.messages) ? json.messages : []);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (creds) fetchFolder(creds, folder);
  }, [creds, folder, fetchFolder]);

  const isUnread = (m: MailMessage) => {
    const id = m._SMMessageGU || "";
    if (unreadOverrides.has(id)) return unreadOverrides.get(id)!;
    return m._MailRead === "false";
  };

  const unreadCount = messages.filter(isUnread).length;

  const toggleRead = async (m: MailMessage) => {
    if (!creds || !m._SMMsgPersonGU) return;
    const id = m._SMMessageGU || "";
    const currentlyUnread = isUnread(m);
    setBusy(true);
    try {
      await synergyPost("/api/synergy/mail/read", creds, {
        sm_msg_person_gu: m._SMMsgPersonGU,
        mark_as_unread: !currentlyUnread,
      });
      setUnreadOverrides((prev) => new Map(prev).set(id, !currentlyUnread));
    } catch (e) {
      alert((e as Error).message || "Failed to update read status");
    } finally {
      setBusy(false);
    }
  };

  const moveMessage = async (m: MailMessage) => {
    if (!creds || !m._SMMsgPersonGU) return;
    const toArchive = folder === "Inbox";
    setBusy(true);
    try {
      await synergyPost("/api/synergy/mail/move", creds, {
        sm_msg_person_gu: m._SMMsgPersonGU,
        folder_type: toArchive ? "3" : "0",
        folder_name: toArchive ? "Archive" : "Inbox",
      });
      setMessages((prev) =>
        prev.filter((x) => x._SMMessageGU !== m._SMMessageGU),
      );
      if (selected?._SMMessageGU === m._SMMessageGU) {
        setSelected(null);
        setReplyEmail(null);
      }
    } catch (e) {
      alert(
        (e as Error).message ||
          (toArchive ? "Failed to archive message" : "Failed to restore message"),
      );
    } finally {
      setBusy(false);
    }
  };

  const openReply = async (m: MailMessage) => {
    const sender = senderOf(m);
    const name = sender?._Details1 || "Unknown";
    const subject = `Re: ${m._Subject || ""}`;
    if (!creds || !sender?._GU) return;
    setReplyLoading(true);
    try {
      const data = await synergyPost<{
        SynergyMailRecipientAddressingXML?: { StaffInfoEmails?: unknown };
      }>("/api/synergy/mail/recipient", creds, {
        staff_gu: sender._GU,
        staff_name: name,
        staff_type: sender._RecipientType || "",
      });
      const emails = data?.SynergyMailRecipientAddressingXML?.StaffInfoEmails;
      const email =
        typeof emails === "string" && emails.includes("@") ? emails : null;
      if (email) {
        setReplyEmail(email);
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
      } else {
        alert(`Couldn't find an email address for ${name}.`);
      }
    } catch (e) {
      alert((e as Error).message || "Failed to look up the sender's email");
    } finally {
      setReplyLoading(false);
    }
  };

  const selectMessage = (m: MailMessage) => {
    setSelected(m);
    setReplyEmail(null);
  };

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  const selectedSender = selected ? senderOf(selected) : undefined;
  const selectedAttachments = selected ? attachmentsOf(selected) : [];

  return (
    <div className="p-8 space-y-6 min-h-screen dark:bg-zinc-900">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Mail</h1>
          {!loading && unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} unread</Badge>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant={folder === "Inbox" ? "secondary" : "ghost"}
            size="sm"
            className="h-7"
            disabled={loading && folder !== "Inbox"}
            onClick={() => setFolder("Inbox")}
          >
            <Inbox className="w-4 h-4 mr-1" />
            Inbox
          </Button>
          <Button
            variant={folder === "Archive" ? "secondary" : "ghost"}
            size="sm"
            className="h-7"
            disabled={loading && folder !== "Archive"}
            onClick={() => setFolder("Archive")}
          >
            <Archive className="w-4 h-4 mr-1" />
            Archive
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 md:col-span-1 max-h-[70vh] overflow-auto">
          <h2 className="font-medium mb-3 text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-4 w-25" />
            ) : (
              `${folder} (${messages.length})`
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
          ) : messages.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  {folder === "Inbox" ? <Inbox /> : <Archive />}
                </EmptyMedia>
                <EmptyTitle>
                  {folder === "Inbox" ? "Inbox empty" : "Archive empty"}
                </EmptyTitle>
                <EmptyDescription>
                  {folder === "Inbox"
                    ? "No messages in your inbox."
                    : "Messages you archive will show up here."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="space-y-1">
              {messages.map((m) => {
                const sender = senderOf(m);
                const unread = isUnread(m);
                const active = selected?._SMMessageGU === m._SMMessageGU;
                return (
                  <li key={m._SMMessageGU} className="group relative">
                    <button
                      onClick={() => selectMessage(m)}
                      className={`w-full text-left rounded px-2 py-2 border hover:bg-muted/40 transition text-sm ${
                        active ? "bg-muted/60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {unread && (
                          <span
                            className="size-2 rounded-full bg-blue-500 shrink-0"
                            aria-label="Unread"
                          />
                        )}
                        <span
                          className={`line-clamp-1 ${
                            unread ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {m._Subject || "(No Subject)"}
                        </span>
                        {attachmentsOf(m).length > 0 && (
                          <Paperclip className="size-3 text-zinc-400 shrink-0 ml-auto" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {sender?._Details1 || "Unknown"} •{" "}
                        {m._SendDateTimeFormattedShort ||
                          formatDate(m._SendDateTime)}
                      </div>
                    </button>
                    <Button
                      onClick={() => moveMessage(m)}
                      disabled={busy}
                      variant="ghost"
                      size="sm"
                      title={
                        folder === "Inbox"
                          ? "Archive message"
                          : "Restore to Inbox"
                      }
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    >
                      {folder === "Inbox" ? (
                        <Archive className="w-3 h-3" />
                      ) : (
                        <ArchiveRestore className="w-3 h-3" />
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-4 md:col-span-2 max-h-[70vh] overflow-auto">
          {loading ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  <Skeleton className="h-7 w-full" />
                </h2>
                <div className="text-xs">
                  <Skeleton className="h-3 w-[40%]" />
                </div>
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold break-words">
                    {selected._Subject || "(No Subject)"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    From: {selectedSender?._Details1 || "Unknown"}
                    {replyEmail ? ` <${replyEmail}>` : ""} •{" "}
                    {formatDate(selected._SendDateTime)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    disabled={busy}
                    onClick={() => toggleRead(selected)}
                    title={
                      isUnread(selected) ? "Mark as read" : "Mark as unread"
                    }
                  >
                    {isUnread(selected) ? (
                      <MailOpen className="w-4 h-4" />
                    ) : (
                      <MailIcon className="w-4 h-4" />
                    )}
                  </Button>
                  {selected._NoReply !== "true" && selectedSender?._GU && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      disabled={replyLoading}
                      onClick={() => openReply(selected)}
                      title="Reply via email"
                    >
                      <Reply className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    disabled={busy}
                    onClick={() => moveMessage(selected)}
                    title={
                      folder === "Inbox"
                        ? "Archive message"
                        : "Restore to Inbox"
                    }
                  >
                    {folder === "Inbox" ? (
                      <Archive className="w-4 h-4" />
                    ) : (
                      <ArchiveRestore className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {selectedAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedAttachments.map((a, i) => (
                    <Badge
                      key={a._SmAttachmentGU || i}
                      variant="outline"
                      className="gap-1"
                    >
                      <Paperclip className="size-3" />
                      {a._DocumentName || a._FileName || "Attachment"}
                    </Badge>
                  ))}
                </div>
              )}
              <div
                className="prose max-w-none text-sm dark:prose-invert"
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

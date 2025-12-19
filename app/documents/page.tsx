"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileQuestionMark } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentDocument {
  comment: string;
  date: string;
  fileName: string;
  guid: string;
  type: string;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<StudentDocument[]>([]);
  const [dateSort, setDateSort] = useState<"desc" | "asc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const base64PdfToObjectUrl = (b64: string) => {
    try {
      const binary = atob(b64.replace(/\s/g, ""));
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn("Failed to convert base64 PDF", e);
      return null;
    }
  };

  useEffect(() => {
    const credsRaw = localStorage.getItem("Student.creds");
    if (!credsRaw) {
      window.location.href = "/login";
      return;
    }
    const creds = JSON.parse(credsRaw);
    setIsLoading(true);
    setError(null);
    fetch("/api/synergy/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const list = data?.StudentDocumentDatas?.StudentDocumentData || [];
        const arr = Array.isArray(list) ? list : [list];
        let mapped: StudentDocument[] = arr.map((d: unknown) => {
          const doc = d as Record<string, unknown>;
          return {
            comment: String(doc?._DocumentComment ?? ""),
            date: String(doc?._DocumentDate ?? ""),
            fileName: String(doc?._DocumentFileName ?? ""),
            guid: String(doc?._DocumentGU ?? ""),
            type: String(doc?._DocumentType ?? ""),
          };
        });
        mapped = mapped.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setDocs(mapped);
        const distinct = Array.from(
          new Set(mapped.map((m) => m.type).filter(Boolean)),
        );
        setTypes(distinct);
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const fetchDocumentBase64 = async (guid: string) => {
    const credsRaw = localStorage.getItem("Student.creds");
    if (!credsRaw) return null;
    const creds = JSON.parse(credsRaw);
    const res = await fetch("/api/synergy/document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, document_guid: guid }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/pdf")) {
      const blob = await res.blob();
      return { base64: await blobToBase64(blob), fileName: `${guid}.pdf` };
    }
    const json = await res.json();
    const docNode =
      json?.StudentAttachedDocumentData?.DocumentDatas?.DocumentData;
    let base64: unknown = docNode?.Base64Code;
    if (
      base64 &&
      typeof base64 === "object" &&
      base64 !== null &&
      "$" in base64
    ) {
      base64 = base64.$;
    }
    const fileName: string = String(
      docNode?._DocumentFileName ?? docNode?._FileName ?? "document.pdf",
    );
    const fallback = json?.pdf as unknown;
    const b64 =
      typeof base64 === "string" && base64.length > 50
        ? base64
        : typeof fallback === "string"
          ? fallback
          : null;
    if (!b64) return null;
    return { base64: b64, fileName };
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(String(reader.result).split(",").pop() || "");
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const openDocument = async (guid: string) => {
    setDownloading(guid);
    try {
      const credsRaw = localStorage.getItem("Student.creds");
      if (!credsRaw) return;
      const creds = JSON.parse(credsRaw);
      const res = await fetch("/api/synergy/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, document_guid: guid }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const json = await res.json();
        const docNode =
          json?.StudentAttachedDocumentData?.DocumentDatas?.DocumentData;
        let base64: unknown = docNode?.Base64Code;
        if (
          base64 &&
          typeof base64 === "object" &&
          base64 !== null &&
          "$" in base64
        ) {
          base64 = base64.$;
        }
        const fileName: string = String(
          docNode?._DocumentFileName ?? docNode._FileName ?? "document.pdf",
        );
        const fallback = json?.pdf as unknown;
        const b64 =
          typeof base64 === "string" && base64.length > 50
            ? base64
            : typeof fallback === "string"
              ? fallback
              : null;
        if (b64) {
          const objectUrl = base64PdfToObjectUrl(b64);
          const pdfUrl = objectUrl || `data:application/pdf;base64,${b64}`;
          const w = window.open(pdfUrl, "_blank");
          if (!w) {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        } else {
          alert("Unable to display document: unexpected response format");
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch document";
      alert(msg);
    } finally {
      setDownloading(null);
    }
  };

  const downloadDocument = async (e: React.MouseEvent, guid: string) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(guid);
    try {
      const result = await fetchDocumentBase64(guid);
      if (!result) throw new Error("Unexpected response format");
      const { base64, fileName } = result;
      const objectUrl =
        base64PdfToObjectUrl(base64) || `data:application/pdf;base64,${base64}`;
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (objectUrl.startsWith("blob:")) {
        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed";
      alert(msg);
    } finally {
      setDownloading(null);
    }
  };

  const sortedDocs = React.useMemo(() => {
    const filtered =
      selectedType === "ALL"
        ? docs
        : docs.filter((d) => d.type === selectedType);
    const clone = [...filtered];
    clone.sort((a, b) => {
      const ad = new Date(a.date).getTime();
      const bd = new Date(b.date).getTime();
      return dateSort === "desc" ? bd - ad : ad - bd;
    });
    return clone;
  }, [docs, dateSort, selectedType]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 space-y-6 min-h-screen dark:bg-zinc-900">
      {!isLoading && !docs.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileQuestionMark />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyTitle>No documents found</EmptyTitle>
          <EmptyDescription>
            No test documents found! If you believe this is an error, please
            contact your district or open a{" "}
            <Link href="/feedback">feedback issue</Link>
          </EmptyDescription>
        </Empty>
      ) : (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              {isLoading ? (
                <Skeleton className="h-8 w-[190px]" />
              ) : (
                <Select
                  value={selectedType}
                  onValueChange={(v) => setSelectedType(v)}
                >
                  <SelectTrigger className="w-[190px] h-8">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All ({docs.length})</SelectItem>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {!isLoading && selectedType !== "ALL" && (
              <button
                type="button"
                className="text-xs underline text-muted-foreground"
                onClick={() => setSelectedType("ALL")}
              >
                Clear filter
              </button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="w-[140px] cursor-pointer select-none"
                  onClick={() =>
                    setDateSort((s) => (s === "desc" ? "asc" : "desc"))
                  }
                  title="Click to sort by date"
                >
                  {isLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    `Date ${dateSort === "desc" ? "↓" : "↑"}`
                  )}
                </TableHead>
                <TableHead>
                  {isLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    "Type"
                  )}
                </TableHead>
                <TableHead>
                  {isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    "Name"
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-64" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-10" />
                      </TableCell>
                    </TableRow>
                  ))
                : sortedDocs.map((doc) => (
                    <TableRow
                      key={doc.guid}
                      onClick={() =>
                        downloading ? null : openDocument(doc.guid)
                      }
                      onKeyDown={(e) => {
                        if (
                          (e.key === "Enter" || e.key === " ") &&
                          !downloading
                        ) {
                          e.preventDefault();
                          openDocument(doc.guid);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-disabled={downloading === doc.guid}
                      className={`hover:underline {downloading === doc.guid ? 'opacity-60' : 'hover:bg-muted/50'} focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500`}
                    >
                      <TableCell className="text-sm hover:cursor-pointer">
                        {doc.date}
                      </TableCell>
                      <TableCell className="hover:cursor-pointer">
                        {doc.type}
                      </TableCell>
                      <TableCell
                        className="max-w-[420px] truncate hover:cursor-pointer"
                        title={doc.comment}
                      >
                        {doc.comment}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          className="hover:cursor-pointer"
                          variant="ghost"
                          size="sm"
                          disabled={downloading === doc.guid}
                          onClick={(e) => downloadDocument(e, doc.guid)}
                        >
                          <Download />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {!isLoading && docs.length > 0 && (
        <p className="text-xs text-gray-500">
          {isLoading ? (
            <Skeleton className="h-4 w-[150px]" />
          ) : (
            `Showing ${docs.length} document(s).`
          )}
        </p>
      )}
    </div>
  );
}

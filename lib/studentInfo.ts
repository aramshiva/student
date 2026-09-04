// helpers for reading the StudentInfo payload (GetStudentInfoData).
//
// the shape varies by server: the v2 REST API returns camelCase keys
// (permID, homeRoom), while the legacy XML-backed shape returned PascalCase
// keys with attributes prefixed _/@_/@ and scalars wrapped in { $ } text
// nodes. these read either without the caller caring which.

export type StudentInfoRecord = Record<string, unknown>;

interface LegacyStudentInfoWrapper {
  data?: { StudentInfo?: StudentInfoRecord };
}

export function scalarValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    if ("$" in rec) return scalarValue(rec.$);
    if ("#text" in rec) return scalarValue(rec["#text"]);
    return "";
  }
  return String(value).trim();
}

export function infoField(source: unknown, name: string): string {
  if (!source || typeof source !== "object") return "";
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(
    source as Record<string, unknown>,
  )) {
    if (key.replace(/^[@_]+/, "").toLowerCase() !== target) continue;
    const text = scalarValue(value);
    if (text) return text;
  }
  return "";
}

// digs the record out of whichever envelope the server used
export function unwrapStudentInfo(payload: unknown): StudentInfoRecord | null {
  if (!payload || typeof payload !== "object") return null;
  const legacy = (payload as LegacyStudentInfoWrapper).data?.StudentInfo;
  if (legacy && typeof legacy === "object") return legacy;
  const record = payload as StudentInfoRecord;
  return Object.keys(record).length ? record : null;
}

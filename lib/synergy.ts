// with the introduction of StudentVUE's v2 backend, the old SOAP API is no more!

// the new flow:
// 1. send a POST to /AttemptLogin with `Authorization: Basic base64(user:pass)`, and recieve an
// access token and refresh token.
// 2. send a POST to method with an authorization bearer with the access token and
// body { arguments: { request: "<stringified json>" } }.
// 3. Responses are { error, data } JSON in camelCase (no more XML).

// app attest (AttestKeyId / LoginAssertion) is NOT enforced server-side, only client side.
import { XMLParser } from "fast-xml-parser";

export type MailData = Record<string, unknown>;
export type Attendance = Record<string, unknown>;
export type StudentInfo = Record<string, unknown>;
export type Gradebook = Record<string, unknown>;
export type Documents = Record<string, unknown>;
export type ReportCard = Record<string, unknown>;
export type Schedule = Record<string, unknown>;
export type HealthInfo = Record<string, unknown>;

export interface DistrictInfo {
  name: string;
  address: string;
  host: string; // synergy serve`r url`
}

export interface LoginTokens {
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  expires_in: number | null;
  scope: string | null;
}

const sanitizeDomain = (raw: string): { host: string; pathPrefix: string } => {
  let s = (raw || "").trim();

  const lower = s.toLowerCase();
  if (lower.startsWith("http://")) s = s.slice(7);
  else if (lower.startsWith("https://")) s = s.slice(8);

  const atIdx = s.indexOf("@");
  if (atIdx !== -1) s = s.slice(atIdx + 1);

  for (const cut of ["?", "#"]) {
    const idx = s.indexOf(cut);
    if (idx !== -1) s = s.slice(0, idx);
  }

  // split host from path prefix at the first slash
  let host: string;
  let pathPrefix = "";
  const slashIdx = s.indexOf("/");
  if (slashIdx !== -1) {
    host = s.slice(0, slashIdx);
    pathPrefix = s.slice(slashIdx); // includes leading /
  } else {
    host = s;
  }

  while (pathPrefix.endsWith("/")) pathPrefix = pathPrefix.slice(0, -1);
  while (host.endsWith(".")) host = host.slice(0, -1);

  if (host === "sisstudent.fcps.edu" && !pathPrefix) pathPrefix = "/SVUE";

  host = host.toLowerCase();

  if (!host) throw new Error("Host is empty");
  if (host.length > 253) throw new Error("Host too long");

  const labels = host.split(".");
  for (const label of labels) {
    if (label.length > 63) throw new Error("dns label too long");
    if (label.startsWith("-") || label.endsWith("-")) {
      throw new Error("dns label invalid");
    }
  }

  return { host, pathPrefix };
};

interface MinimalFetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string | ArrayBuffer | Uint8Array;
  signal?: AbortSignal;
}

async function fetchWithTimeout(
  input: RequestInfo,
  init: MinimalFetchInit = {},
  ms = 15000,
) {
  // validate url to prevent req forgery
  const url = typeof input === "string" ? input : input.url;
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed");
  }
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(input, {
      ...(init as RequestInit),
      signal: c.signal,
      cache: "no-store" as const,
    });
  } finally {
    clearTimeout(id);
  }
}

function upstreamError(label: string, status: number, raw: string): Error {
  return new Error(
    process.env.NODE_ENV === "development"
      ? `HTTP ${status} from ${label}: ${raw.slice(0, 400)}`
      : `HTTP ${status} from ${label}`,
  );
}

interface RestEnvelope {
  error: { code?: string; message?: string; stackTrace?: unknown } | null;
  data: Record<string, unknown> | null;
}

function randomNonce(): string {
  return Math.random().toString(36).slice(2, 13);
}

export class SynergyClient {
  private domain: string;
  private pathPrefix: string;
  private userID: string;
  private password: string;
  private tokens?: LoginTokens;
  private sessionCookie?: string;

  constructor(domain: string, userID: string, password: string) {
    const sanitized = sanitizeDomain(domain);
    this.domain = sanitized.host;
    this.pathPrefix = sanitized.pathPrefix;
    this.userID = userID;
    this.password = password;
  }

  static async districtLookup(zip: string | number): Promise<DistrictInfo[]> {
    const zipStr = String(zip).trim();
    if (!/^\d{5}$/.test(zipStr)) {
      throw new Error("Invalid ZIP code (expect 5 digits)");
    }
    const paramStr = `&lt;Parms&gt;&lt;Key&gt;5E4B7859-B805-474B-A833-FDB15D205D40&lt;/Key&gt;&lt;MatchToDistrictZipCode&gt;${zipStr}&lt;/MatchToDistrictZipCode&gt;&lt;/Parms&gt;`;
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">
      <userID>EdupointDistrictInfo</userID>
      <password>Edup01nt</password>
      <skipLoginLog>1</skipLoginLog>
      <parent>0</parent>
      <webServiceHandleName>HDInfoServices</webServiceHandleName>
      <methodName>GetMatchingDistrictList</methodName>
      <paramStr>${paramStr}</paramStr>
    </ProcessWebServiceRequest>
  </soap:Body>
</soap:Envelope>`;

    const res = await fetchWithTimeout(
      "https://support.edupoint.com/Service/HDInfoCommunication.asmx",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction:
            "http://edupoint.com/webservices/ProcessWebServiceRequest",
        },
        body: soapBody,
      },
    );
    const text = await res.text();
    if (!res.ok) throw new Error(`District lookup failed HTTP ${res.status}`);

    const districtParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "_",
    });
    let outer: Record<string, unknown>;
    try {
      outer = districtParser.parse(text);
    } catch {
      throw new Error("Failed to parse district SOAP response");
    }
    const resultStr = drill(
      outer,
      "soap:Envelope",
      "soap:Body",
      "ProcessWebServiceRequestResponse",
      "ProcessWebServiceRequestResult",
    );
    if (typeof resultStr !== "string" || !resultStr) return [];
    const unescaped = resultStr
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    let inner: Record<string, unknown>;
    try {
      inner = districtParser.parse(unescaped);
    } catch {
      return [];
    }
    const rawNodes =
      drill(inner, "DistrictLists", "DistrictList", "DistrictInfo") ??
      drill(inner, "DistrictLists", "DistrictInfos", "DistrictInfo");
    const districtNodes: unknown[] = Array.isArray(rawNodes)
      ? rawNodes
      : rawNodes
        ? [rawNodes]
        : [];
    return districtNodes
      .map((d) => {
        const obj = d as Record<string, unknown>;
        return {
          name: String(obj._Name || obj.Name || ""),
          address: String(obj._Address || obj.Address || ""),
          host: String(obj._PvueURL || obj.PvueURL || ""),
        } satisfies DistrictInfo;
      })
      .filter((d) => d.name && d.host);
  }

  private apiBase(): string {
    return `https://${this.domain}${this.pathPrefix}/api/v1/mobile/PXPWebServices`;
  }

  private basicAuth(): string {
    const b64 = Buffer.from(`${this.userID}:${this.password}`).toString(
      "base64",
    );
    return `Basic ${b64}`;
  }

  async login(): Promise<LoginTokens> {
    if (this.tokens) return this.tokens;

    const path = "/api/v1/mobile/PXPWebServices/AttemptLogin";
    const request = JSON.stringify({
      userID: null,
      password: null,
      userType: "Student",
      LoginClientData: `POST:${path}:${Date.now()}:${randomNonce()}`,
      DeviceModel: "Student (web)",
    });

    const res = await fetchWithTimeout(`${this.apiBase()}/AttemptLogin`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        Authorization: this.basicAuth(),
        "User-Agent": "SynergyClient",
      },
      body: JSON.stringify({ arguments: { request } }),
    });

    const setCookies =
      res.headers.getSetCookie?.() ??
      (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")!] : []);
    const jar: string[] = [];
    for (const c of setCookies) {
      const pair = c.split(";")[0]?.trim();
      if (pair && /^(ASP\.NET_SessionId|PVUE|EES_PSV)=/i.test(pair)) {
        jar.push(pair);
      }
    }
    if (jar.length) this.sessionCookie = jar.join("; ");

    const raw = await res.text().catch(() => "");
    if (!res.ok) throw upstreamError("AttemptLogin", res.status, raw);

    let parsed: Partial<LoginTokens>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Malformed AttemptLogin response");
    }
    if (!parsed.access_token) {
      throw new Error(`Login failed: no access token returned: ${raw}`);
    }
    this.tokens = {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token ?? null,
      token_type: parsed.token_type ?? null,
      expires_in: parsed.expires_in ?? null,
      scope: parsed.scope ?? null,
    };
    return this.tokens;
  }

  // Core authentication call func.
  // returns `data` payload or throws (camelCase :)
  // on an error envelope. childIntID + languageCode are sent on every request
  // (the primary student is childIntID 0); pass extra/override params in `params`.
  async call<T = Record<string, unknown>>(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const { access_token } = await this.login();
    const request = JSON.stringify({
      childIntID: 0,
      languageCode: "1",
      ...(params ?? {}),
    });

    const res = await fetchWithTimeout(`${this.apiBase()}/${method}`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
        "User-Agent": "SynergyClient",
      },
      body: JSON.stringify({ arguments: { request } }),
    });

    const raw = await res.text().catch(() => "");
    if (!res.ok) throw upstreamError(method, res.status, raw);

    let env: RestEnvelope;
    try {
      env = JSON.parse(raw);
    } catch {
      throw new Error(`Malformed ${method} response`);
    }
    if (env.error) {
      // 2100 == "no data available" for this student/period. The old SOAP
      // client surfaced that as an empty payload, so mirror it instead of
      // throwing (keeps the UI on an empty state rather than a 500).
      if (env.error.code === "2100") return {} as T;
      const msg = env.error.message || env.error.code || "Unknown Synergy error";
      throw new Error(String(msg));
    }
    return (env.data ?? {}) as T;
  }

  async sessionCookieHeader(): Promise<string> {
    await this.login();
    if (!this.sessionCookie) {
      throw new Error("No session cookie available");
    }
    return this.sessionCookie;
  }

  async clientSideData<T = unknown>(
    action: string,
    payload: { FriendlyName: string; Method: string; Parameters: string },
  ): Promise<T> {
    await this.login();
    if (!this.sessionCookie) {
      throw new Error("No session cookie available for ClientSideData");
    }
    const res = await fetchWithTimeout(
      `https://${this.domain}${this.pathPrefix}/api/GB/ClientSideData/Transfer?action=${encodeURIComponent(action)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json, */*",
          "Content-Type": "application/json",
          Cookie: this.sessionCookie,
          "User-Agent": "SynergyClient",
        },
        body: JSON.stringify(payload),
      },
    );
    const raw = await res.text().catch(() => "");
    if (!res.ok) throw upstreamError(action, res.status, raw);
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(`Malformed ${action} response`);
    }
  }

  async getTestAnalysis(): Promise<Record<string, unknown>> {
    return this.clientSideData("pxp.test.analysis-get", {
      FriendlyName: "pxp.test.analysis",
      Method: "get",
      Parameters: "{}",
    });
  }

  // for not yet confirmed endpoints, do a softcall so it sends an empty state
  private async softCall<T = Record<string, unknown>>(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    try {
      return await this.call<T>(method, params);
    } catch {
      return {} as T;
    }
  }

  private static unwrap(
    data: Record<string, unknown>,
    key: string,
  ): Record<string, unknown> {
    if (key in data) return data[key] as Record<string, unknown>;
    const lower = key.charAt(0).toLowerCase() + key.slice(1);
    if (lower in data) return data[lower] as Record<string, unknown>;
    return data;
  }

  async checkLogin(): Promise<void> {
    await this.login();
  }

  async getDocuments(): Promise<Documents> {
    const data = await this.call("GetStudentDocuments");
    return SynergyClient.unwrap(data, "studentDocuments");
  }

  async getSchedule(termIndex?: number): Promise<Schedule> {
    const data = await this.call(
      "StudentClassList",
      termIndex !== undefined ? { TermIndex: termIndex } : undefined,
    );
    return SynergyClient.unwrap(data, "studentClassList");
  }

  async getGradebook(reportPeriod?: number): Promise<Gradebook> {
    const data = await this.call("Gradebook", {
      concurrentSchOrgYearGU: "",
      ...(reportPeriod ? { ReportPeriod: reportPeriod } : {}),
    });
    return SynergyClient.unwrap(data, "gradebook");
  }

  // TODO(api): confirm new method name + response wrapper key. softCall until then.
  async getStudentInfo(): Promise<StudentInfo> {
    const data = await this.softCall("StudentInfo");
    return SynergyClient.unwrap(data, "studentInfo");
  }

  // TODO(api): confirm new method name + response wrapper key. softCall until then.
  async getAttendance(): Promise<Attendance> {
    const data = await this.softCall("Attendance");
    return SynergyClient.unwrap(data, "attendance");
  }

  // TODO(api): confirm method name + params (DocumentGU casing) + response.
  async getReportCard(documentGU: string): Promise<ReportCard> {
    const data = await this.softCall("GetReportCardDocumentData", {
      DocumentGU: documentGU,
    });
    return SynergyClient.unwrap(data, "documentData");
  }

  // TODO(api): confirm method name + response wrapper key.
  async listReportCards(): Promise<Record<string, unknown>> {
    return this.softCall("GetReportCardInitialData");
  }

  async getDocument(documentGuid: string): Promise<Record<string, unknown>> {
    const data = await this.call("GetStudentDocumentContent", {
      documentGU: documentGuid,
    });
    return SynergyClient.unwrap(data, "studentAttachedDocumentData");
  }

  async getMessages(): Promise<Record<string, unknown>> {
    const data = await this.call("GetPXPContentMessage");
    return SynergyClient.unwrap(data, "pxpMessagesData");
  }

  // TODO(api): confirm method name + response wrapper key. softCall until then.
  async getCalendar(): Promise<Record<string, unknown>> {
    const data = await this.softCall("StudentCalendar");
    return SynergyClient.unwrap(data, "studentCalendar");
  }

  async getSchoolInfo(): Promise<Record<string, unknown>> {
    const data = await this.call("GetSchoolInformationData");
    return SynergyClient.unwrap(data, "studentSchoolInfoListing");
  }

  async getMyAccount(): Promise<Record<string, unknown>> {
    const data = await this.call("GetContentMyAccountData");
    return SynergyClient.unwrap(data, "pxpMyAccountData");
  }

  async getChildList(): Promise<Record<string, unknown>> {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const syncDate = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const data = await this.call("GetChildListData", {
      mobileAppLastSyncDateTime: syncDate,
      legacyAppRequest: false,
      secondaryLogin: false,
    });
    return SynergyClient.unwrap(data, "children");
  }

  // TODO(api): confirm method name + params (old was PXP2 AttGetCalendarDay).
  async getCalendarDay(date: string): Promise<Record<string, unknown>> {
    return this.softCall("AttGetCalendarDay", { date });
  }

  async getMailData(): Promise<MailData> {
    return this.getMailFolderData("Inbox");
  }

  async getMailFolderData(
    folder: string,
    opts: { loadMessageBody?: boolean; skip?: number; take?: number } = {},
  ): Promise<MailData> {
    const { loadMessageBody = true, skip = 0, take = 10 } = opts;
    const data = await this.call("GetSynergyMailMessage", {
      folderGU: folder,
      loadMessageBody: String(loadMessageBody),
      skip: String(skip),
      take: String(take),
    });
    return SynergyClient.unwrap(data, "synergyMailDataXML");
  }

  async getMailBodies(guids: string[]): Promise<Map<string, string>> {
    const bodyMap = new Map<string, string>();
    if (guids.length === 0) return bodyMap;
    const mail = (await this.getMailFolderData("Inbox", {
      loadMessageBody: true,
      take: 100,
    })) as { inboxItemListings?: Record<string, unknown>[] };
    const wanted = new Set(guids);
    for (const item of mail.inboxItemListings ?? []) {
      const guid = item.smMessageGU;
      const html = item.messageText;
      if (typeof guid === "string" && wanted.has(guid) && typeof html === "string") {
        bodyMap.set(guid, html);
      }
    }
    return bodyMap;
  }

  async markMailRead(
    smMsgPersonGU: string,
    markAsUnread: boolean,
  ): Promise<void> {
    await this.call("SynergyMailReadOrDeleteMsg", {
      SynergyEmailMarkList: {
        SmMessagePersonGUList: smMsgPersonGU,
        ProcessRead: true,
        MarkAsUnread: markAsUnread,
      },
    });
  }

  async moveMailToFolder(
    smMsgPersonGU: string,
    folderType: string,
    folderName: string,
  ): Promise<void> {
    await this.call("SynergyMailMoveMessageToFolder", {
      SynergyEmailMoveToFolder: {
        SmMessagePersonGU: smMsgPersonGU,
        FolderType: folderType,
        SmFolderGU: "",
        FolderName: folderName,
      },
    });
  }

  async getMailRecipient(
    staffGU: string,
    staffName: string,
    staffType: string,
  ): Promise<Record<string, unknown>> {
    return this.softCall("SynergyMailGetRecipientAddressing", {
      Recipients: { StaffGU: staffGU, StaffName: staffName, StaffType: staffType },
    });
  }
}

function drill(obj: unknown, ...keys: string[]): unknown {
  let cur: unknown = obj;
  for (const key of keys) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

// this is where the magic happens!
import { XMLBuilder, XMLParser } from "fast-xml-parser";

export type MailData = Record<string, unknown>;
export type Attendance = Record<string, unknown>;
export type StudentInfo = Record<string, unknown>;
export type Gradebook = Record<string, unknown>;
export type Documents = Record<string, unknown>;
export type ReportCard = Record<string, unknown>;
export type Attachment = Record<string, unknown>;
export type AuthToken = Record<string, unknown>;
export type Schedule = Record<string, unknown>;
export type HealthInfo = Record<string, unknown>;

export interface CourseCatalogEntry {
  ID: string;
  Detail: string;
  Department: string;
  CourseID: string;
  CourseTitle: string;
  CourseDuration: string;
  Credit: string;
  Term: string;
  CollegePrep: string;
  CourseFee: string;
  OCRElective: string;
  OCRLocked: string;
  OCRComment: string;
  Schools: string;
}

export interface CourseCatalogResponse {
  success: boolean;
  data: CourseCatalogEntry[];
  totalCount: number;
}

export interface CourseRequestEntry {
  ID: string;
  Detail: string;
  Department: string;
  CourseID: string;
  CourseTitle: string;
  CourseDuration: string;
  Credit: string;
  CollegePrep: string;
  CourseFee: string;
  OCRElective: string;
  OCRLocked: string;
  OCRComment: string;
  Schools: string;
  SchedPriorityElective: string;
  TermOverride: string;
  TermPreference: string | null;
  OCRAction: string;
}

export interface AddCourseResponse {
  refreshSearch: boolean;
  mainResults: CourseRequestEntry[];
  altResults: CourseRequestEntry[] | null;
  teacherResults: unknown[];
}

export interface DistrictInfo {
  name: string;
  address: string;
  host: string; // synergy server url
}

const alwaysArray = new Set<string>([
  "SynergyMailDataXML.FolderListViews.FolderListViewXML",
  "SynergyMailDataXML.InboxItemListings.MessageXML",
  "SynergyMailDataXML.SentItemListings.MessageXML",
  "SynergyMailDataXML.DraftItemListings.MessageXML",
  "SynergyMailDataXML.InboxItemListings.MessageXML.Attachments.AttachmentXML",
  "RecipientXML",

  "Gradebook.Courses.Course",
  "Gradebook.Courses.Course.Marks.Mark.Assignments.Assignment",
  "Gradebook.ReportingPeriods.ReportPeriod",

  "Attendance.Absences.Absence",
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  ignoreDeclaration: true,
  attributeNamePrefix: "_",
  isArray: (_name, jpath) => alwaysArray.has(jpath),
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "_",
});

const escapeXmlText = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const sanitizeDomain = (raw: string): { host: string; pathPrefix: string } => {
  // sanitize and validate a synergy host string
  // some schools use cutom domain prefixs eg. sisstudent.fcps.edu/svue
  let s = (raw || "").trim();

  const lower = s.toLowerCase();
  if (lower.startsWith("http://")) s = s.slice(7);
  else if (lower.startsWith("https://")) s = s.slice(8);

  const atIdx = s.indexOf("@");
  if (atIdx !== -1) {
    s = s.slice(atIdx + 1);
  }

  for (const cut of ["?", "#"]) {
    const idx = s.indexOf(cut);
    if (idx !== -1) {
      s = s.slice(0, idx);
    }
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

  // clean up path prefix: strip trailing slashes
  while (pathPrefix.endsWith("/")) pathPrefix = pathPrefix.slice(0, -1);

  while (host.endsWith(".")) host = host.slice(0, -1);

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
    return await fetch(input, { ...(init as any), signal: c.signal, cache: "no-store" as const }); // eslint-disable-line @typescript-eslint/no-explicit-any
  } finally {
    clearTimeout(id);
  }
}

type Operation =
  | "ProcessWebServiceRequest"
  | "ProcessWebServiceRequestMultiWeb";

export class SynergyClient {
  private domain: string;
  private pathPrefix: string;
  private userID: string;
  private password: string;

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
    const soapBody = `<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n  <soap:Body>\n    <ProcessWebServiceRequest xmlns=\"http://edupoint.com/webservices/\">\n      <userID>EdupointDistrictInfo</userID>\n      <password>Edup01nt</password>\n      <skipLoginLog>1</skipLoginLog>\n      <parent>0</parent>\n      <webServiceHandleName>HDInfoServices</webServiceHandleName>\n      <methodName>GetMatchingDistrictList</methodName>\n      <paramStr>${paramStr}</paramStr>\n    </ProcessWebServiceRequest>\n  </soap:Body>\n</soap:Envelope>`;

    // builds a SOAP body to edupoint's support database, which returns all districts using StudentVUE.
    const res = await fetch(
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
    if (!res.ok) {
      throw new Error(`District lookup failed HTTP ${res.status}`);
    }
    const outerParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "_",
    });
    let outer: unknown;
    try {
      outer = outerParser.parse(text);
    } catch {
      throw new Error("Failed to parse district SOAP response");
    }
    const resultStr = (
      (
        (
          (outer as Record<string, unknown>)?.["soap:Envelope"] as
            | Record<string, unknown>
            | undefined
        )?.["soap:Body"] as Record<string, unknown> | undefined
      )?.ProcessWebServiceRequestResponse as Record<string, unknown> | undefined
    )?.ProcessWebServiceRequestResult as unknown;
    if (!resultStr || typeof resultStr !== "string") {
      return [];
    }
    const unescaped = (resultStr as string)
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    let inner: unknown;
    try {
      inner = outerParser.parse(unescaped);
    } catch {
      return [];
    }
    const districtContainer =
      (
        (inner as Record<string, unknown>)?.DistrictLists as
          | Record<string, unknown>
          | undefined
      )?.DistrictList ||
      (
        (inner as Record<string, unknown>)?.DistrictLists as
          | Record<string, unknown>
          | undefined
      )?.DistrictInfos;
    const rawNodes: unknown = (
      districtContainer as Record<string, unknown> | undefined
    )?.DistrictInfo;
    const districtNodes: unknown[] = Array.isArray(rawNodes)
      ? rawNodes
      : rawNodes
        ? [rawNodes]
        : [];
    const districts = districtNodes
      .map((d) => {
        const obj = d as Record<string, unknown>;
        const name = (obj._Name || obj.Name || "") as string;
        const address = (obj._Address || obj.Address || "") as string;
        const host = (obj._PvueURL || obj.PvueURL || "") as string;
        return { name, address, host } satisfies DistrictInfo;
      })
      .filter((d) => d.name && d.host);
    return districts;
  }

  private endpoint() {
    return `https://${this.domain}${this.pathPrefix}/Service/PXPCommunication.asmx`;
  }

  private buildEnvelope(
    operation: Operation,
    methodName: string,
    params: unknown,
  ) {
    const paramXml = builder.build({ Params: params ?? {} });
    const paramStr = escapeXmlText(paramXml);

    return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <${operation} xmlns="http://edupoint.com/webservices/">
      <userID>${this.userID}</userID>
      <password>${this.password}</password>
      <skipLoginLog>true</skipLoginLog>
      <parent>false</parent>
      <webServiceHandleName>PXPWebServices</webServiceHandleName>
      <methodName>${methodName}</methodName>
      <paramStr>${paramStr}</paramStr>
    </${operation}>
  </soap12:Body>
</soap12:Envelope>`.trim();
  }

  private async soapRequest(
    operation: Operation,
    methodName: string,
    params?: unknown,
  ) {
    const res = await fetchWithTimeout(this.endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/soap+xml; charset=utf-8" },
      body: this.buildEnvelope(operation, methodName, params),
    });

    const raw = await res.text().catch(() => "");
    if (!res.ok)
      throw new Error(
        process.env.NODE_ENV === "development" // only log in dev, resuting in no logging of user data.
          ? `HTTP ${res.status} from Synergy: ${raw.slice(0, 400)}`
          : `HTTP ${res.status} from Synergy`,
      );

    const outer = parser.parse(raw);
    const responseNode =
      outer?.["soap:Envelope"]?.["soap:Body"]?.[`${operation}Response`];
    const resultStr = responseNode?.[`${operation}Result`];
    if (!resultStr || typeof resultStr !== "string")
      throw new Error("Malformed SOAP response");

    const result = parser.parse(resultStr);
    if (result?.RT_ERROR) {
      const msg =
        result.RT_ERROR._ERROR_MESSAGE ??
        result.RT_ERROR._ERROR_USER_MESSAGE ??
        "Unknown Synergy error";
      throw new Error(String(msg));
    }
    return result;
  }

  private request(methodName: string, params?: unknown) {
    return this.soapRequest("ProcessWebServiceRequest", methodName, params);
  }

  private requestMultiWeb(methodName: string, params?: unknown) {
    return this.soapRequest(
      "ProcessWebServiceRequestMultiWeb",
      methodName,
      params,
    );
  }

  async checkLogin(): Promise<void> {
    await this.request("StudentInfo");
  }

  async getAuthToken(): Promise<AuthToken> {
    const r = await this.requestMultiWeb("GenerateAuthToken", {
      Username: this.userID,
      TokenForClassWebSite: true,
      Usertype: 0,
      IsParentStudent: 0,
      DataString: "",
      DocumentID: 1,
      AssignmentID: 1,
    });
    return r?.AuthToken ?? {};
  }

  async getGradebook(reportPeriod?: number): Promise<Gradebook> {
    const r = await this.request(
      "Gradebook",
      reportPeriod ? { ReportPeriod: reportPeriod } : {},
    );
    return r?.Gradebook ?? {};
  }

  async getAttendance(): Promise<Attendance> {
    const r = await this.request("Attendance");
    return r?.Attendance ?? {};
  }

  async getStudentInfo(): Promise<StudentInfo> {
    const r = await this.request("StudentInfo");
    return r?.StudentInfo ?? {};
  }

  async getDocuments(): Promise<Documents> {
    const r = await this.request("GetStudentDocumentInitialData");
    return r?.StudentDocuments ?? {};
  }

  async getReportCard(documentGU: string): Promise<ReportCard> {
    const r = await this.request("GetReportCardDocumentData", {
      DocumentGU: documentGU,
    });
    return r?.DocumentData ?? {};
  }

  async getMailData(): Promise<MailData> {
    const r = await this.request("SynergyMailGetData");
    return r?.SynergyMailDataXML ?? {};
  }

  async getSchedule(termIndex?: number): Promise<Schedule> {
    const r = await this.request(
      "StudentClassList",
      termIndex !== undefined ? { TermIndex: termIndex } : {},
    );
    return r?.StudentClassList ?? {};
  }

  async getMessages(): Promise<Record<string, unknown>> {
    const r = await this.request("GetPXPMessages");
    return r ?? {};
  }

  async getCalendar(): Promise<Record<string, unknown>> {
    const r = await this.request("StudentCalendar");
    return r?.StudentCalendar ?? {};
  }

  async getClassNotes(): Promise<Record<string, unknown>> {
    const r = await this.request("StudentHWNotes");
    return r?.StudentHWNotes ?? {};
  }

  async getSchoolInfo(): Promise<Record<string, unknown>> {
    const r = await this.request("StudentSchoolInfo");
    return r?.StudentSchoolInfo ?? {};
  }

  async listReportCards(): Promise<Record<string, unknown>> {
    const r = await this.request("GetReportCardInitialData");
    return r ?? {};
  }

  async getDocument(documentGuid: string): Promise<Record<string, unknown>> {
    const r = await this.request("GetContentOfAttachedDoc", {
      DocumentGU: documentGuid,
    });
    return r ?? {};
  }
  async getHealthInfo(options?: {
    childIntID?: number;
    healthConditions?: boolean;
    healthVisits?: boolean;
    healthImmunizations?: boolean;
  }): Promise<HealthInfo> {
    const {
      childIntID = 0,
      healthConditions = false,
      healthVisits = false,
      healthImmunizations = true,
    } = options || {};

    const r = await this.requestMultiWeb("StudentHealthInfo", {
      ChildIntID: childIntID,
      HealthConditions: healthConditions,
      HealthVisits: healthVisits,
      HealthImmunizations: healthImmunizations,
    });
    return r?.StudentHealthData ?? {};
  }

  private async getSessionCookie(): Promise<string> {
    const c = new AbortController();
    const id = setTimeout(() => c.abort(), 15000);
    try {
      // Use raw globalThis.fetch to bypass Next.js fetch caching,
      // which can strip set-cookie headers from cached responses.
      const res = await globalThis.fetch(this.endpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/soap+xml; charset=utf-8" },
        body: this.buildEnvelope(
          "ProcessWebServiceRequest",
          "StudentInfo",
          {},
        ),
        signal: c.signal,
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`Session init HTTP ${res.status}`);

      const setCookie =
        res.headers.getSetCookie?.().join("; ") ||
        res.headers.get("set-cookie") ||
        "";
      const match = setCookie.match(/ASP\.NET_SessionId=([^;\s]+)/i);
      if (!match) throw new Error("Missing ASP.NET_SessionId");
      return `ASP.NET_SessionId=${match[1]}`;
    } finally {
      clearTimeout(id);
    }
  }

  private pxp2Endpoint() {
    return `https://${this.domain}${this.pathPrefix}/Service/PXP2Communication.asmx/DXDataGridRequest`;
  }

  async getCourseCatalog(
    termIndex = 1,
  ): Promise<CourseCatalogResponse> {
    const cookie = await this.getSessionCookie();

    const res = await fetchWithTimeout(this.pxp2Endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, */*",
        Cookie: cookie,
      },
      body: JSON.stringify({
        request: {
          agu: 0,
          dataRequestType: "Load",
          gridParameters: JSON.stringify({
            AGU: "0",
            TermIndexForHomeSchool: termIndex,
          }),
        },
      }),
    });

    const raw = await res.text().catch(() => "");
    if (!res.ok)
      throw new Error(
        process.env.NODE_ENV === "development"
          ? `HTTP ${res.status} from DXDataGrid: ${raw.slice(0, 400)}`
          : `HTTP ${res.status} from DXDataGrid`,
      );

    const json = JSON.parse(raw);
    const inner = json?.d?.Data;
    if (!inner || !inner.success) {
      throw new Error(json?.d?.Error || "DXDataGrid request failed");
    }

    return {
      success: inner.success,
      data: inner.data ?? [],
      totalCount: inner.totalCount ?? 0,
    };
  }

  async getCourseRequests(
    termIndex = 1,
    searchValue: string | null = null,
  ): Promise<CourseCatalogResponse> {
    const cookie = await this.getSessionCookie();

    const res = await fetchWithTimeout(this.pxp2Endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, */*",
        Cookie: cookie,
      },
      body: JSON.stringify({
        request: {
          agu: 0,
          dataRequestType: "Load",
          gridParameters: JSON.stringify({
            AGU: "0",
            TermIndexForHomeSchool: termIndex,
          }),
          dataSourceTypeName: "9D8B759A-CDAF-47D5-9036-085782D785DA",
          loadOptions: {
            searchOperation: "contains",
            searchValue,
          },
        },
      }),
    });

    const raw = await res.text().catch(() => "");
    if (!res.ok)
      throw new Error(
        process.env.NODE_ENV === "development"
          ? `HTTP ${res.status} from DXDataGrid: ${raw.slice(0, 400)}`
          : `HTTP ${res.status} from DXDataGrid`,
      );

    const json = JSON.parse(raw);
    const inner = json?.d?.Data;
    if (!inner || !inner.success) {
      throw new Error(json?.d?.Error || "DXDataGrid request failed");
    }

    return {
      success: inner.success,
      data: inner.data ?? [],
      totalCount: inner.totalCount ?? 0,
    };
  }

  private courseRequestEndpoint() {
    return `https://${this.domain}${this.pathPrefix}/PXP2_CourseRequest.aspx/AddCourse`;
  }

  async addCourse(schoolYearCourseGU: string): Promise<AddCourseResponse> {
    const cookie = await this.getSessionCookie();

    const res = await fetchWithTimeout(this.courseRequestEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, */*",
        Cookie: cookie,
      },
      body: JSON.stringify({
        request: {
          agu: 0,
          schoolYearCourseGU,
        },
      }),
    });

    const raw = await res.text().catch(() => "");
    if (!res.ok)
      throw new Error(
        process.env.NODE_ENV === "development"
          ? `HTTP ${res.status} from AddCourse: ${raw.slice(0, 400)}`
          : `HTTP ${res.status} from AddCourse`,
      );

    const json = JSON.parse(raw);
    const inner = json?.d?.Data;
    if (json?.d?.Error) {
      throw new Error(json.d.Error);
    }
    if (!inner) {
      throw new Error("AddCourse request failed");
    }

    return {
      refreshSearch: inner.refreshSearch ?? false,
      mainResults: inner.mainResults ?? [],
      altResults: inner.altResults ?? null,
      teacherResults: inner.teacherResults ?? [],
    };
  }

  async removeCourse(crAccessGU: string): Promise<AddCourseResponse> {
    const cookie = await this.getSessionCookie();

    const res = await fetchWithTimeout(
      `https://${this.domain}${this.pathPrefix}/PXP2_CourseRequest.aspx/RemoveCourse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, */*",
          Cookie: cookie,
        },
        body: JSON.stringify({
          request: {
            agu: 0,
            crAccessGU,
          },
        }),
      },
    );

    const raw = await res.text().catch(() => "");
    if (!res.ok)
      throw new Error(
        process.env.NODE_ENV === "development"
          ? `HTTP ${res.status} from RemoveCourse: ${raw.slice(0, 400)}`
          : `HTTP ${res.status} from RemoveCourse`,
      );

    const json = JSON.parse(raw);
    const inner = json?.d?.Data;
    if (json?.d?.Error) {
      throw new Error(json.d.Error);
    }
    if (!inner) {
      throw new Error("RemoveCourse request failed");
    }

    return {
      refreshSearch: inner.refreshSearch ?? false,
      mainResults: inner.mainResults ?? [],
      altResults: inner.altResults ?? null,
      teacherResults: inner.teacherResults ?? [],
    };
  }

  async call<T = unknown>(methodName: string, params?: unknown): Promise<T> {
    return this.request(methodName, params) as Promise<T>;
  }
}

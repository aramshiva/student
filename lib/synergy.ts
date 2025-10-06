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

const sanitizeDomain = (raw: string) =>
  raw.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

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
  const url = typeof input === 'string' ? input : input.url;
  const parsedUrl = new URL(url);
  
  if (parsedUrl.protocol !== 'https:') { // only allow https!
    throw new Error('Only HTTPS URLs are allowed');
  }
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(input, { ...(init as any), signal: c.signal }); // eslint-disable-line @typescript-eslint/no-explicit-any
  } finally {
    clearTimeout(id);
  }
}

type Operation =
  | "ProcessWebServiceRequest"
  | "ProcessWebServiceRequestMultiWeb";

export class SynergyClient {
  private domain: string;
  private userID: string;
  private password: string;

  constructor(domain: string, userID: string, password: string) {
    this.domain = sanitizeDomain(domain);
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

    const res = await fetch("https://support.edupoint.com/Service/HDInfoCommunication.asmx", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://edupoint.com/webservices/ProcessWebServiceRequest",
      },
      body: soapBody,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`District lookup failed HTTP ${res.status}`);
    }
    const outerParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "_" });
    let outer: unknown;
    try {
      outer = outerParser.parse(text);
    } catch {
      throw new Error("Failed to parse district SOAP response");
    }
    const resultStr = (outer as any)?.["soap:Envelope"]?.["soap:Body"]?.ProcessWebServiceRequestResponse?.ProcessWebServiceRequestResult as unknown; // eslint-disable-line @typescript-eslint/no-explicit-any
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
    const districtContainer = (inner as any)?.DistrictLists?.DistrictList || (inner as any)?.DistrictLists?.DistrictInfos; // eslint-disable-line @typescript-eslint/no-explicit-any
    const rawNodes: unknown = districtContainer?.DistrictInfo;
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
    return `https://${this.domain}/Service/PXPCommunication.asmx`;
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
        process.env.NODE_ENV === 'development' 
          ? `HTTP ${res.status} from Synergy: ${raw.slice(0, 400)}`
          : `HTTP ${res.status} from Synergy`
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

  // async getSchedule(termIndex?: number): Promise<Schedule> {
  //     const params: Record<string, unknown> = {};

  //     if (termIndex !== undefined) {
  //         params.TermIndex = termIndex;
  //     }

  //     const r = await this.request('StudentClassList', params);
  //     return r?.StudentClassList ?? {};
  // }

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

  async call<T = unknown>(methodName: string, params?: unknown): Promise<T> {
    return this.request(methodName, params) as Promise<T>;
  }
}

import { XMLBuilder, XMLParser } from 'fast-xml-parser';

export type MailData = Record<string, unknown>;
export type Attendance = Record<string, unknown>;
export type StudentInfo = Record<string, unknown>;
export type Gradebook = Record<string, unknown>;
export type Documents = Record<string, unknown>;
export type ReportCard = Record<string, unknown>;
export type Attachment = Record<string, unknown>;
export type AuthToken = Record<string, unknown>;

const alwaysArray = new Set<string>([
  'SynergyMailDataXML.FolderListViews.FolderListViewXML',
  'SynergyMailDataXML.InboxItemListings.MessageXML',
  'SynergyMailDataXML.SentItemListings.MessageXML',
  'SynergyMailDataXML.DraftItemListings.MessageXML',
  'SynergyMailDataXML.InboxItemListings.MessageXML.Attachments.AttachmentXML',
  'RecipientXML',

  'Gradebook.Courses.Course',
  'Gradebook.Courses.Course.Marks.Mark.Assignments.Assignment',
  'Gradebook.ReportingPeriods.ReportPeriod',

  'Attendance.Absences.Absence',
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  ignoreDeclaration: true,
  attributeNamePrefix: '_',
  isArray: (_name, jpath) => alwaysArray.has(jpath),
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '_',
});

const escapeXmlText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const sanitizeDomain = (raw: string) =>
  raw.replace(/^https?:\/\//i, '').replace(/\/+$/g, '');

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 15000) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: c.signal });
  } finally {
    clearTimeout(id);
  }
}

type Operation = 'ProcessWebServiceRequest' | 'ProcessWebServiceRequestMultiWeb';

export class SynergyClient {
  private domain: string;
  private userID: string;
  private password: string;

  constructor(domain: string, userID: string, password: string) {
    this.domain = sanitizeDomain(domain);
    this.userID = userID;
    this.password = password;
  }

  private endpoint() {
    return `https://${this.domain}/Service/PXPCommunication.asmx`;
  }

  private buildEnvelope(operation: Operation, methodName: string, params: unknown) {
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

  private async soapRequest(operation: Operation, methodName: string, params?: unknown) {
    const res = await fetchWithTimeout(this.endpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
      body: this.buildEnvelope(operation, methodName, params),
    });

    const raw = await res.text().catch(() => '');
    if (!res.ok) throw new Error(`HTTP ${res.status} from Synergy: ${raw.slice(0, 400)}`);

    const outer = parser.parse(raw);
    const responseNode = outer?.['soap:Envelope']?.['soap:Body']?.[`${operation}Response`];
    const resultStr = responseNode?.[`${operation}Result`];
    if (!resultStr || typeof resultStr !== 'string') throw new Error('Malformed SOAP response');

    const result = parser.parse(resultStr);
    if (result?.RT_ERROR) {
      const msg =
        result.RT_ERROR._ERROR_MESSAGE ??
        result.RT_ERROR._ERROR_USER_MESSAGE ??
        'Unknown Synergy error';
      throw new Error(String(msg));
    }
    return result;
  }

  private request(methodName: string, params?: unknown) {
    return this.soapRequest('ProcessWebServiceRequest', methodName, params);
  }

  private requestMultiWeb(methodName: string, params?: unknown) {
    return this.soapRequest('ProcessWebServiceRequestMultiWeb', methodName, params);
  }


  async checkLogin(): Promise<void> {
    await this.request('StudentInfo');
  }

  async getAuthToken(): Promise<AuthToken> {
    const r = await this.requestMultiWeb('GenerateAuthToken', {
      Username: this.userID,
      TokenForClassWebSite: true,
      Usertype: 0,
      IsParentStudent: 0,
      DataString: '',
      DocumentID: 1,
      AssignmentID: 1,
    });
    return r?.AuthToken ?? {};
  }

  async getGradebook(reportPeriod?: number): Promise<Gradebook> {
    const r = await this.request('Gradebook', reportPeriod ? { ReportPeriod: reportPeriod } : {});
    return r?.Gradebook ?? {};
  }

  async getAttendance(): Promise<Attendance> {
    const r = await this.request('Attendance');
    return r?.Attendance ?? {};
  }

  async getStudentInfo(): Promise<StudentInfo> {
    const r = await this.request('StudentInfo');
    return r?.StudentInfo ?? {};
  }

  async getDocuments(): Promise<Documents> {
    const r = await this.request('GetStudentDocumentInitialData');
    return r?.StudentDocuments ?? {};
  }

  async getReportCard(documentGU: string): Promise<ReportCard> {
    const r = await this.request('GetReportCardDocumentData', { DocumentGU: documentGU });
    return r?.DocumentData ?? {};
  }

  async getMailData(): Promise<MailData> {
    const r = await this.request('SynergyMailGetData');
    return r?.SynergyMailDataXML ?? {};
  }

  async getDocument(attachmentGU: string): Promise<Attachment> {
    const r = await this.request('SynergyMailGetAttachment', { SmAttachmentGU: attachmentGU });
    return r?.AttachmentXML ?? {};
  }

  async call<T = unknown>(methodName: string, params?: unknown): Promise<T> {
    return this.request(methodName, params) as Promise<T>;
  }
}

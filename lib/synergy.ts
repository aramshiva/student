// lib/synergy.ts
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

export type MailData = object;

const alwaysArray = [
  'SynergyMailDataXML.FolderListViews.FolderListViewXML',
  'SynergyMailDataXML.InboxItemListings.MessageXML',
  'SynergyMailDataXML.SentItemListings.MessageXML',
  'SynergyMailDataXML.DraftItemListings.MessageXML',
  'SynergyMailDataXML.InboxItemListings.MessageXML.Attachments.AttachmentXML',
  'RecipientXML',
];

const parser = new XMLParser({
  ignoreAttributes: false,
  ignoreDeclaration: true,
  attributeNamePrefix: '_',
  isArray: (_name, jpath) => alwaysArray.includes(jpath),
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '_',
});

export class SynergyClient {
  private domain: string;
  private userID: string;
  private password: string;

  constructor(domain: string, userID: string, password: string) {
    this.domain = domain;
    this.userID = userID;
    this.password = password;
  }

  private async soapRequest(operation: 'ProcessWebServiceRequest' | 'ProcessWebServiceRequestMultiWeb', methodName: string, params: unknown = {}) {
    const paramStr = builder
      .build({ Params: params })
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

    const body = `<?xml version="1.0" encoding="utf-8"?>
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

    const res = await fetch(`https://${this.domain}/Service/PXPCommunication.asmx?WSDL`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
      body,
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} from Synergy: ${t.slice(0, 300)}`);
    }

    // SOAP -> inner XML string
    const outer = parser.parse(await res.text());
    const resultStr =
      outer['soap:Envelope']?.['soap:Body']?.[`${operation}Response`]?.[`${operation}Result`];

    if (!resultStr) throw new Error('Malformed SOAP response');

    // inner XML string -> object
    const result = parser.parse(resultStr);
    if (result?.RT_ERROR) throw new Error(result.RT_ERROR._ERROR_MESSAGE);

    return result;
  }

  private request(methodName: string, params?: unknown) {
    return this.soapRequest('ProcessWebServiceRequest', methodName, params);
  }

  async getMailData(): Promise<MailData> {
    const r = await this.request('SynergyMailGetData');
    return r.SynergyMailDataXML as MailData;
  }
}

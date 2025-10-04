// how this code works:
// 1. we send a SOAP request to the StudentInfo method with creds, 
// this gives us StudentInfo BUT more importantly a session cookie.
// 2. we extract the ASP.NET_SessionId from the Set-Cookie header
// 3. we send a second request to the RTCommunication.asmx/XMLDoRequest endpoint
//    with an XML body requesting PXP_Get_StudentSummary
// 4. this provides us a response with various data, but more importantly the student name.
// 5. we extract the student name and return it to the caller.
// the reason we do this is, because with the SOAP api, the name is not provided
// and for whatever reason is blank

export async function getStudentNameFromDistrict(params: {
  districtBase: string;
  userId: string;
  password: string;
  timeoutMs?: number;
}): Promise<string> {
  const { districtBase, userId, password, timeoutMs = 15000 } = params;
  if (!districtBase || !userId || !password) return "";

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>\n<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"\n                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">\n  <soap12:Body>\n    <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">\n      <userID>${userId}</userID>\n      <password>${password}</password>\n      <skipLoginLog>true</skipLoginLog>\n      <parent>false</parent>\n      <webServiceHandleName>PXPWebServices</webServiceHandleName>\n      <methodName>StudentInfo</methodName>\n      <paramStr>&lt;Params/&gt;</paramStr>\n    </ProcessWebServiceRequest>\n  </soap12:Body>\n</soap12:Envelope>`;

    const soapRes = await fetch(`${districtBase}/Service/PXPCommunication.asmx`, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        Accept: "*/*",
        "User-Agent": "SynergyClient/NameFetch",
      },
      body: soapBody,
      signal: controller.signal,
    });

  if (!soapRes.ok) throw new Error(`StudentInfo HTTP ${soapRes.status}`);

    const setCookie = soapRes.headers.get("set-cookie") || "";
    let sessionId: string | null = null;
    const directMatch = setCookie.match(/ASP\.NET_SessionId=([^;\s]+)/i);
    if (directMatch) {
      sessionId = directMatch[1];
    } else {
      const idx = setCookie.indexOf("ASP.NET_SessionId=");
      if (idx !== -1) {
        const sub = setCookie.slice(idx + "ASP.NET_SessionId=".length);
        sessionId = sub.split(";")[0].trim();
      }
    }
    if (!sessionId) throw new Error("Missing ASP.NET_SessionId");

    const cookieHeader = `ASP.NET_SessionId=${sessionId}`;
    const summaryXml = '<REV_REQUEST><EVENT NAME="PXP_Get_StudentSummary"><REQUEST></REQUEST></EVENT></REV_REQUEST>';

    async function postSummary(rawBody: string): Promise<{ status: number; text: string }> {
      const res = await fetch(
        `${districtBase}/Service/RTCommunication.asmx/XMLDoRequest?PORTAL=StudentVUE`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: cookieHeader,
            "User-Agent": "SynergyClient/NameFetch",
            Accept: "*/*",
          },
          body: rawBody,
          signal: controller.signal,
        },
      );
      const text = await res.text();
      return { status: res.status, text };
    }

    let result = await postSummary(summaryXml);
    if (result.status >= 400) {
      const encoded = "xml=" + encodeURIComponent(summaryXml);
      result = await postSummary(encoded);
    }

    function extractStudentPayload(xmlText: string): { ok: true; parsed: any } | { ok: false } { // eslint-disable-line @typescript-eslint/no-explicit-any
      const startTag = '<JSON_RESPONSE><![CDATA[';
      const endTag = ']]></JSON_RESPONSE>';
      const startIdx = xmlText.indexOf(startTag);
      if (startIdx === -1) return { ok: false };
      const afterStart = startIdx + startTag.length;
      const endIdx = xmlText.indexOf(endTag, afterStart);
      if (endIdx === -1) return { ok: false };
      const jsonRaw = xmlText.slice(afterStart, endIdx).trim();
      try {
        const parsed = JSON.parse(jsonRaw);
        return { ok: true, parsed };
      } catch {
        return { ok: false };
      }
    }

    function fromParsed(obj: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!obj || !Array.isArray(obj.students)) return "";
      const first = obj.students[0];
      if (first && typeof first.name === "string" && first.name.trim()) return first.name.trim();
      return "";
    }

    const payload = extractStudentPayload(result.text);
    if (!payload.ok) return "";
    const name = fromParsed(payload.parsed);
    return name || "";
  } finally {
    clearTimeout(t);
  }
}

export default getStudentNameFromDistrict;
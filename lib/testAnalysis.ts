// how this code works:
// 1. we send a SOAP request to the StudentInfo method with creds, 
// this gives us StudentInfo BUT more importantly a session cookie.
// 2. we extract the ASP.NET_SessionId from the Set-Cookie header
// 3. we send a second request to the /api/GB/ClientSideData/Transfer?action=pxp.test.analysis-get endpoint
//    with a JSON body requesting the test analysis data
// 4. this provides us a response with all tests the user has taken
// and scores
// 5. we return this data to the caller

export interface TestAnalysisTest {
  GU?: string;
  Name?: string;
  GridData?: Record<string, string>[];
  GridColumns?: string[];
  ChartData?: unknown;
  LegendData?: unknown;
  ShowChart?: boolean;
  GroupOrder?: string;
}

export interface TestAnalysisResponse {
  availableTests?: TestAnalysisTest[];
  [k: string]: unknown;
}

export async function getTestAnalysis(params: {
  districtBase: string;
  userId: string;
  password: string;
  timeoutMs?: number;
}): Promise<TestAnalysisResponse | null> {
  const { districtBase, userId, password, timeoutMs = 15000 } = params;
  if (!districtBase || !userId || !password) return null;

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
    const analysisUrl = `${districtBase}/api/GB/ClientSideData/Transfer?action=pxp.test.analysis-get`;
    const analysisBody = JSON.stringify({
      FriendlyName: "pxp.test.analysis",
      Method: "get",
      Parameters: "{}",
    });

    const analysisRes = await fetch(analysisUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
        Accept: "application/json, */*",
        "User-Agent": "SynergyClient/TestAnalysis",
      },
      body: analysisBody,
      signal: controller.signal,
    });

    if (!analysisRes.ok) return null;
    const json = await analysisRes.json().catch(() => null);
    if (!json || typeof json !== "object") return null;
    return json as TestAnalysisResponse;
  } finally {
    clearTimeout(t);
  }
}
export default getTestAnalysis;
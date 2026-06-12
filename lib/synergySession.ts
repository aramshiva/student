// Several PXP2/RT endpoints (student summary, test analysis, course history)
// don't accept per-request credentials. Instead we log in once via the
// StudentInfo SOAP method, which sets an ASP.NET_SessionId cookie, and replay
// that cookie on the follow-up request.
import { escapeXmlText } from "@/lib/synergy";

export interface SynergySessionParams {
  districtBase: string; // e.g. https://wa-bsd405-psv.edupoint.com
  userId: string;
  password: string;
  signal?: AbortSignal;
  userAgent?: string;
}

export function extractSessionId(setCookie: string): string | null {
  const match = setCookie.match(/ASP\.NET_SessionId=([^;\s]+)/i);
  return match ? match[1] : null;
}

function buildLoginEnvelope(userId: string, password: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">
      <userID>${escapeXmlText(userId)}</userID>
      <password>${escapeXmlText(password)}</password>
      <skipLoginLog>true</skipLoginLog>
      <parent>false</parent>
      <webServiceHandleName>PXPWebServices</webServiceHandleName>
      <methodName>StudentInfo</methodName>
      <paramStr>&lt;Params/&gt;</paramStr>
    </ProcessWebServiceRequest>
  </soap12:Body>
</soap12:Envelope>`;
}

// logs in and returns a Cookie header value ("ASP.NET_SessionId=...")
export async function getSessionCookie(
  params: SynergySessionParams,
): Promise<string> {
  const { districtBase, userId, password, signal, userAgent } = params;

  const res = await fetch(`${districtBase}/Service/PXPCommunication.asmx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/soap+xml; charset=utf-8",
      Accept: "*/*",
      "User-Agent": userAgent || "SynergyClient",
    },
    body: buildLoginEnvelope(userId, password),
    signal,
  });

  if (!res.ok) throw new Error(`StudentInfo HTTP ${res.status}`);

  const setCookie =
    res.headers.getSetCookie?.().join("; ") ||
    res.headers.get("set-cookie") ||
    "";
  const sessionId = extractSessionId(setCookie);
  if (!sessionId) throw new Error("Missing ASP.NET_SessionId");
  return `ASP.NET_SessionId=${sessionId}`;
}

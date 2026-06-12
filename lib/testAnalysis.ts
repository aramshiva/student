// how this code works:
// 1. we log in via the StudentInfo SOAP method to get a session cookie
//    (see lib/synergySession.ts)
// 2. we send a second request to the /api/GB/ClientSideData/Transfer?action=pxp.test.analysis-get
//    endpoint with a JSON body requesting the test analysis data
// 3. this provides us a response with all tests the user has taken and scores
import { getSessionCookie } from "@/lib/synergySession";

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
    const cookieHeader = await getSessionCookie({
      districtBase,
      userId,
      password,
      signal: controller.signal,
      userAgent: "SynergyClient/TestAnalysis",
    });

    const analysisRes = await fetch(
      `${districtBase}/api/GB/ClientSideData/Transfer?action=pxp.test.analysis-get`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
          Accept: "application/json, */*",
          "User-Agent": "SynergyClient/TestAnalysis",
        },
        body: JSON.stringify({
          FriendlyName: "pxp.test.analysis",
          Method: "get",
          Parameters: "{}",
        }),
        signal: controller.signal,
      },
    );

    if (!analysisRes.ok) return null;
    const json = await analysisRes.json().catch(() => null);
    if (!json || typeof json !== "object") return null;
    return json as TestAnalysisResponse;
  } finally {
    clearTimeout(t);
  }
}

export default getTestAnalysis;

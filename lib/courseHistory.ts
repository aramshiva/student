import fetch from "node-fetch";
import { JSDOM } from "jsdom";

type Input = {
  districtUrl: string;
  username: string;
  password: string;
  timeoutMs?: number;
};

const UA = "SynergyClient/CourseHistory";

function extractSessionId(setCookie: string): string | null {
  const directMatch = setCookie.match(/ASP\.NET_SessionId=([^;\s]+)/i);
  if (directMatch) return directMatch[1];
  const idx = setCookie.indexOf("ASP.NET_SessionId=");
  if (idx === -1) return null;
  const sub = setCookie.slice(idx + "ASP.NET_SessionId=".length);
  return sub.split(";")[0]?.trim() || null;
}

function normalizeDistrictUrl(raw: string): string {
  let s = (raw || "").trim();
  if (!s) throw new Error("districtUrl is required");
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  s = s.replace(/\/+$/, "");
  return s;
}

function stripStudentSubdomain(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.toLowerCase().startsWith("student.")) {
      u.hostname = u.hostname.slice("student.".length);
      return u.toString().replace(/\/$/, "");
    }
    return url;
  } catch {
    return url;
  }
}

export async function fetchStudentVue({
  districtUrl,
  username,
  password,
  timeoutMs = 15000,
}: Input) {
  if (!districtUrl || !username || !password) {
    throw new Error("districtUrl, username, and password are required");
  }

  const base = normalizeDistrictUrl(districtUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>\n<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"\n                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">\n  <soap12:Body>\n    <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">\n      <userID>${username}</userID>\n      <password>${password}</password>\n      <skipLoginLog>true</skipLoginLog>\n      <parent>false</parent>\n      <webServiceHandleName>PXPWebServices</webServiceHandleName>\n      <methodName>StudentInfo</methodName>\n      <paramStr>&lt;Params/&gt;</paramStr>\n    </ProcessWebServiceRequest>\n  </soap12:Body>\n</soap12:Envelope>`;

    const soapRes = await fetch(`${base}/Service/PXPCommunication.asmx`, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        Accept: "*/*",
        "User-Agent": UA,
      },
      body: soapBody,
      signal: controller.signal,
    });

    if (!soapRes.ok) {
      throw new Error(`StudentInfo HTTP ${soapRes.status}`);
    }

    const setCookie = soapRes.headers.get("set-cookie") || "";
    const sessionId = extractSessionId(setCookie);
    if (!sessionId) {
      throw new Error("Missing ASP.NET_SessionId");
    }

    const cookieHeader = `ASP.NET_SessionId=${sessionId}`;

    async function fetchCourseHistoryPage(baseUrl: string): Promise<string> {
      const resp = await fetch(`${baseUrl}/PXP2_CourseHistory.aspx?AGU=0`, {
        signal: controller.signal,
        headers: { "User-Agent": UA, Cookie: cookieHeader },
      });
      if (!resp.ok) {
        throw new Error(`CourseHistory HTTP ${resp.status}`);
      }
      return resp.text();
    }

    let html: string;
    try {
      html = await fetchCourseHistoryPage(base);
    } catch (err) {
      const altBase = stripStudentSubdomain(base);
      if (altBase !== base) {
        html = await fetchCourseHistoryPage(altBase);
      } else {
        throw err;
      }
    }

    const page = new JSDOM(html);
    const document = page.window.document;

    const scriptText = Array.from(
      document.querySelectorAll("script") as unknown as Array<{ textContent: string | null }>,
    )
      .map((s) => s.textContent || "")
      .find((t) => t.includes("PXP.CourseHistory"));

    let courseHistory: unknown = null;
    if (scriptText) {
      const match = scriptText.match(/PXP\.CourseHistory\s*=\s*(\[[\s\S]*?\]);/);
      if (match) {
        try {
          courseHistory = JSON.parse(match[1]);
        } catch {
          courseHistory = null;
        }
      }
    }

      const gradRows = Array.from(
        document.querySelectorAll(".pxp-summary .details tbody tr[data-guid]") as unknown as Array<
        HTMLElement
      >,
    ).map((tr) => {
      const cells = tr.querySelectorAll("td, th") as unknown as Array<
        HTMLElement
      >;
      return {
        subject: cells[0]?.textContent?.trim(),
        required: cells[1]?.textContent?.trim(),
        completed: cells[2]?.textContent?.trim(),
        inProgress: cells[3]?.textContent?.trim(),
        remaining: cells[4]?.textContent?.trim(),
        guid: tr.getAttribute("data-guid"),
      };
    });

    return {
      graduationRequirements: gradRows,
      courseHistory,
    };
  } finally {
    clearTimeout(timer);
  }
}
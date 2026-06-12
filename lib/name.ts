// how this code works:
// 1. we log in via the StudentInfo SOAP method to get a session cookie
//    (see lib/synergySession.ts)
// 2. we send a second request to the RTCommunication.asmx/XMLDoRequest endpoint
//    with an XML body requesting PXP_Get_StudentSummary
// 3. this provides us a response with various data, including the student name.
// the reason we do this is, because with the SOAP api, the name is not provided
// and for whatever reason is blank
import { getSessionCookie } from "@/lib/synergySession";

type StudentSummaryResponse = {
  students: { name: string }[];
  [key: string]: unknown;
};

const SUMMARY_REQUEST_XML =
  '<REV_REQUEST><EVENT NAME="PXP_Get_StudentSummary"><REQUEST></REQUEST></EVENT></REV_REQUEST>';

function extractStudentPayload(xmlText: string): StudentSummaryResponse | null {
  // the response wraps a JSON document in <JSON_RESPONSE><![CDATA[...]]>
  const startTag = "<JSON_RESPONSE><![CDATA[";
  const endTag = "]]></JSON_RESPONSE>";
  const startIdx = xmlText.indexOf(startTag);
  if (startIdx === -1) return null;
  const afterStart = startIdx + startTag.length;
  const endIdx = xmlText.indexOf(endTag, afterStart);
  if (endIdx === -1) return null;
  const jsonRaw = xmlText.slice(afterStart, endIdx).trim();
  try {
    return JSON.parse(jsonRaw) as StudentSummaryResponse;
  } catch {
    return null;
  }
}

async function fetchStudentSummary(params: {
  districtBase: string;
  userId: string;
  password: string;
  timeoutMs: number;
  userAgent: string;
}): Promise<StudentSummaryResponse | null> {
  const { districtBase, userId, password, timeoutMs, userAgent } = params;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const cookieHeader = await getSessionCookie({
      districtBase,
      userId,
      password,
      signal: controller.signal,
      userAgent,
    });

    async function postSummary(
      rawBody: string,
    ): Promise<{ status: number; text: string }> {
      const res = await fetch(
        `${districtBase}/Service/RTCommunication.asmx/XMLDoRequest?PORTAL=StudentVUE`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: cookieHeader,
            "User-Agent": userAgent,
            Accept: "*/*",
          },
          body: rawBody,
          signal: controller.signal,
        },
      );
      const text = await res.text();
      return { status: res.status, text };
    }

    // some servers want the raw XML, others want it form-encoded
    let result = await postSummary(SUMMARY_REQUEST_XML);
    if (result.status >= 400) {
      result = await postSummary("xml=" + encodeURIComponent(SUMMARY_REQUEST_XML));
    }

    return extractStudentPayload(result.text);
  } finally {
    clearTimeout(t);
  }
}

export async function getStudentNameFromDistrict(params: {
  districtBase: string;
  userId: string;
  password: string;
  timeoutMs?: number;
}): Promise<string> {
  const { districtBase, userId, password, timeoutMs = 15000 } = params;
  if (!districtBase || !userId || !password) return "";

  const summary = await fetchStudentSummary({
    districtBase,
    userId,
    password,
    timeoutMs,
    userAgent: "SynergyClient/NameFetch",
  });
  if (!summary || !Array.isArray(summary.students)) return "";
  const name = summary.students[0]?.name;
  return typeof name === "string" ? name.trim() : "";
}

export async function getStudentSummaryFromDistrict(params: {
  districtBase: string;
  userId: string;
  password: string;
  timeoutMs?: number;
}): Promise<StudentSummaryResponse | null> {
  const { districtBase, userId, password, timeoutMs = 15000 } = params;
  if (!districtBase || !userId || !password) return null;

  try {
    return await fetchStudentSummary({
      districtBase,
      userId,
      password,
      timeoutMs,
      userAgent: "SynergyClient/SummaryFetch",
    });
  } catch {
    return null;
  }
}

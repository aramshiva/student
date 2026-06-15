import * as cheerio from "cheerio";
import { getSessionCookie } from "@/lib/synergySession";

type Input = {
  districtUrl: string;
  username: string;
  password: string;
  timeoutMs?: number;
};

const UA = "SynergyClient/CourseHistory";

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
    const cookieHeader = await getSessionCookie({
      districtBase: base,
      userId: username,
      password,
      signal: controller.signal,
      userAgent: UA,
    });

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

    // some districts serve the portal from student.<domain> but the course
    // history page only from the bare domain
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

    const $ = cheerio.load(html);

    const scriptText = $("script")
      .toArray()
      .map((el) => $(el).html() || "")
      .find((t) => t.includes("PXP.CourseHistory"));

    let courseHistory: unknown = null;
    if (scriptText) {
      const match = scriptText.match(
        /PXP\.CourseHistory\s*=\s*(\[[\s\S]*?\]);/,
      );
      if (match) {
        try {
          courseHistory = JSON.parse(match[1]);
        } catch {
          courseHistory = null;
        }
      }
    }

    const gradRows = $(".pxp-summary .details tbody tr[data-guid]")
      .toArray()
      .map((tr) => {
        const $tr = $(tr);
        const cells = $tr.find("td, th").toArray();
        return {
          subject: $(cells[0]).text().trim(),
          required: $(cells[1]).text().trim(),
          completed: $(cells[2]).text().trim(),
          inProgress: $(cells[3]).text().trim(),
          remaining: $(cells[4]).text().trim(),
          guid: $tr.attr("data-guid") || "",
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

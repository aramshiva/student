import * as cheerio from "cheerio";

// PXP2_Student.aspx renders panels of <table class="info_tbl">, each opening
// with a <tr class="row_subhdr"> title and holding either label/value cells
// (<span class="tbl_label">Label</span><br>Value) or a plain header/row grid
// like the phone number list. it carries fields GetStudentInfoData returns
// blank (homeroom teacher, counselor, legal names, grad year), so we scrape it.

export interface StudentPageRow {
  label: string;
  value: string;
}

export interface StudentPageTable {
  headers: string[];
  rows: string[][];
}

export interface StudentPageSection {
  title: string;
  fields: StudentPageRow[];
  table?: StudentPageTable;
}

// details rendered in the page chrome / embedded in PXP.NavigationData rather
// than in the info tables: district, school phone, the pronunciation clip
export interface StudentPageMeta {
  district: string;
  fullName: string;
  studentId: string;
  school: string;
  schoolPhone: string;
  photoPath: string;
  schoolLogoPath: string;
  namePronunciationPath: string;
  modules: string[];
}

export interface StudentPageData {
  sections: StudentPageSection[];
  meta: StudentPageMeta;
}

interface NavigationData {
  items?: { description?: string; enabled?: boolean }[];
  students?: {
    name?: string;
    sisNumber?: string;
    school?: string;
    phone?: string;
    photo?: string;
    current?: boolean;
  }[];
}

// PXP.NavigationData = { ... }; in an inline script
function parseNavigationData(html: string): NavigationData | null {
  const marker = html.indexOf("PXP.NavigationData");
  if (marker === -1) return null;
  const start = html.indexOf("{", marker);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1)) as NavigationData;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const EMPTY_PLACEHOLDER = /^no\s.*(provided|available|information)\.?$/i;

function clean(text: string): string {
  const cleaned = text.replace(/ /g, " ").replace(/\s+/g, " ").trim();
  return cleaned === "-" ? "" : cleaned;
}

export function parseStudentPage(html: string): StudentPageData {
  const $ = cheerio.load(html);
  const sections: StudentPageSection[] = [];

  $("table.info_tbl").each((_, element) => {
    const table = $(element);
    // only cells belonging to this table, not to any nested one
    const owned = (selector: string) =>
      table.find(selector).filter((_i, el) => $(el).closest("table").is(table));

    const headerRows = owned("tr.row_subhdr");
    const title = clean(headerRows.first().find("span.value").first().text());

    const fields: StudentPageRow[] = [];
    owned("td").each((_i, cell) => {
      const td = $(cell);
      const labelNode = td.find("span.tbl_label").first();
      if (!labelNode.length) return;
      const label = clean(labelNode.text());
      const body = td.clone();
      body.find("span.tbl_label").remove();
      const value = clean(body.text());
      if (label && value) fields.push({ label, value });
    });

    // a grid rather than label/value pairs: headers live in the second
    // subheader row, data in the remaining rows
    let grid: StudentPageTable | undefined;
    if (fields.length === 0 && headerRows.length > 1) {
      const headers = headerRows
        .eq(1)
        .find("th")
        .map((_i, th) => clean($(th).text()))
        .get();
      const rows: string[][] = [];
      owned("tr").each((_i, tr) => {
        const row = $(tr);
        if (row.hasClass("row_subhdr")) return;
        const cells = row
          .find("td")
          .map((_j, td) => clean($(td).text()))
          .get();
        if (!cells.length) return;
        if (cells.every((c) => !c)) return;
        if (cells.length === 1 && EMPTY_PLACEHOLDER.test(cells[0])) return;
        rows.push(cells);
      });
      if (headers.length && rows.length) grid = { headers, rows };
    }

    if (!title || (fields.length === 0 && !grid)) return;
    sections.push({ title, fields, ...(grid ? { table: grid } : {}) });
  });

  const nav = parseNavigationData(html);
  const navStudent =
    nav?.students?.find((student) => student.current) ?? nav?.students?.[0];

  // "Good evening, Aram Shiva, 8/18/2026" -> "Aram Shiva"
  const greeting = clean($("#Greeting").text());
  const greetingName = clean(
    greeting.replace(/^[^,]*,\s*/, "").replace(/,\s*[\d/]+$/, ""),
  );

  // the pronunciation clip is a media path, not something to print as text
  let namePronunciationPath = "";
  for (const section of sections) {
    section.fields = section.fields.filter((row) => {
      if (!/\.(mp3|wav|m4a)$/i.test(row.value)) return true;
      namePronunciationPath = row.value;
      return false;
    });
  }

  const meta: StudentPageMeta = {
    district: clean($("#DistrictName").text()),
    fullName: greetingName || clean($(".student-name").first().text()),
    studentId: clean($(".student-id").first().text()).replace(/^ID:\s*/i, ""),
    school:
      clean($(".student-details .school").first().text()) ||
      clean(navStudent?.school ?? ""),
    schoolPhone: clean(
      $(".student-details .phone").first().text().replace(/[()]/g, ""),
    ),
    photoPath: clean(navStudent?.photo ?? ""),
    // the header logo carries a cache-busting query string the asset proxy rejects
    schoolLogoPath: clean(
      ($("img[src*='PXPHeaderLogo']").first().attr("src") ?? "").split("?")[0],
    ),
    namePronunciationPath,
    modules: (nav?.items ?? [])
      .filter((item) => item.enabled && item.description)
      .map((item) => clean(item.description as string)),
  };

  return { sections, meta };
}

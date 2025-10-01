import { NextResponse } from "next/server";
import { SynergyClient } from "@/lib/synergy";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { district_url, username, password, reportPeriod, term_index } = body;

    if (!district_url || !username || !password) {
      return NextResponse.json(
        { error: "district_url, username, and password are required" },
        { status: 400 },
      );
    }

    const client = new SynergyClient(
      String(district_url),
      String(username),
      String(password),
    );

    const param: Record<string, unknown> = {};
    if (term_index != null) param.TermIndex = Number(term_index);
    else if (reportPeriod != null) param.ReportPeriod = reportPeriod;
    const raw = await client.call("StudentClassList", param);

    const schedule =
      raw && typeof raw === "object" && "StudentClassList" in raw
        ? (raw as { StudentClassList: unknown }).StudentClassList
        : (raw ?? {});
    return NextResponse.json(schedule, { status: 200 });
  } catch (e: unknown) {
    const msg =
      e instanceof Error
        ? e.name === "AbortError"
          ? "Request timed out"
          : e.message
        : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { SynergyClient } from "@/lib/synergy";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { district_url, username, password, reportPeriod } = body;

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

    const param = reportPeriod != null ? { ReportPeriod: reportPeriod } : {};
    const raw = await client.call("Gradebook", param);

    const gradebook =
      raw && typeof raw === "object" && "Gradebook" in raw
        ? (raw as { Gradebook: unknown }).Gradebook
        : (raw ?? {});
    return NextResponse.json(gradebook, { status: 200 });
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

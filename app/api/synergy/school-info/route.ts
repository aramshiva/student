import { NextResponse } from "next/server";
import { SynergyClient } from "@/lib/synergy";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { district_url, username, password, request_date } = body;

    if (!district_url || !username || !password) {
      return NextResponse.json(
        { error: "district_url, username, and password are required" },
        { status: 400 },
      );
    }

    const normalizedDomain = String(district_url)
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/$/, "");

    const client = new SynergyClient(
      normalizedDomain,
      String(username),
      String(password),
    );

    const params: Record<string, unknown> = {
      childIntID: 0,
    };

    if (request_date) {
      params.RequestDate = String(request_date);
    }

    const raw = await client.call<Record<string, unknown>>(
      "StudentSchoolInfo",
      params,
    );
    const data =
      raw && typeof raw === "object" && "StudentSchoolInfo" in raw
        ? (raw as Record<string, unknown>).StudentSchoolInfo
        : raw;
    return NextResponse.json(data ?? {}, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

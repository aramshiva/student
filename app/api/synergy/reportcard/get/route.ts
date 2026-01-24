import { NextResponse } from "next/server";
import { SynergyClient } from "@/lib/synergy";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { district_url, username, password, document_guid } = body;

    if (!district_url || !username || !password || !document_guid) {
      return NextResponse.json(
        {
          error:
            "district_url, username, password, and document_guid are required",
        },
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
    const data = await client.getReportCard(String(document_guid));

    return NextResponse.json(data ?? {}, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

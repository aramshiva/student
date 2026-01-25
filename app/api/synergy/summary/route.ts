import { NextResponse } from "next/server";
import { getStudentSummaryFromDistrict } from "@/lib/name";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { district_url, username, password } = body as Record<string, unknown>;

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

    const data = await getStudentSummaryFromDistrict({
      districtBase: `https://${normalizedDomain}`,
      userId: String(username),
      password: String(password),
    });

    if (!data) {
      return NextResponse.json(
        { error: "Failed to fetch student summary" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        message = "Request timed out";
      } else if (err.message === "fetch failed") {
        const code = (err as { cause?: { code?: string } })?.cause?.code;
        message = code ? `Fetch failed (${code})` : "Fetch failed";
      } else {
        message = err.message;
      }
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

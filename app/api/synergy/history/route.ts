import { NextResponse } from "next/server";
import { fetchStudentVue } from "@/lib/courseHistory";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { district_url, username, password, timeout_ms } =
      body as Record<string, unknown>;

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

    const data = await fetchStudentVue({
      districtUrl: `https://${normalizedDomain}`,
      username: String(username),
      password: String(password),
      timeoutMs:
        typeof timeout_ms === "number"
          ? timeout_ms
          : Number(timeout_ms) || undefined,
    });

    return NextResponse.json(data ?? {}, { status: 200 });
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        message = "Request timed out";
      } else if (err.message === "fetch failed") {
        const code = (err as any)?.cause?.code;
        message = code ? `Fetch failed (${code})` : "Fetch failed";
      } else {
        message = err.message;
      }
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

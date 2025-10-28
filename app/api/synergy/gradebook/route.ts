import { NextResponse } from "next/server";
import { SynergyClient } from "@/lib/synergy";
import { getCredentialsFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const credentials = await getCredentialsFromRequest(req);
    
    if (!credentials) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { reportPeriod } = body;

    const client = new SynergyClient(
      credentials.district_url,
      credentials.username,
      credentials.password,
    );

    const param = reportPeriod != null ? { ReportPeriod: reportPeriod } : {};
    const raw = await client.call("Gradebook", param);

    const gradebook =
      raw && typeof raw === "object" && "Gradebook" in raw
        ? (raw as { Gradebook: unknown }).Gradebook
        : (raw ?? {});
    
    const response = NextResponse.json(gradebook, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (e: unknown) {
    const msg =
      e instanceof Error
        ? e.name === "AbortError"
          ? "Request timed out"
          : e.message
        : "Unknown error";
    
    const response = NextResponse.json({ error: msg }, { status: 500 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
}

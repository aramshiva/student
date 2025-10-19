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

    const normalizedDomain = credentials.district_url
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/$/, "");

    const client = new SynergyClient(normalizedDomain, credentials.username, credentials.password);
    const data = await client.getMailData();

    const response = NextResponse.json(data, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    
    const response = NextResponse.json({ error: message }, { status: 500 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
}

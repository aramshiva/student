import { NextResponse } from "next/server";
import { SynergyClient } from "@/lib/synergy";
import { normalizeDomain, routeErrorMessage } from "@/lib/synergyRoute";

export const runtime = "nodejs";

// streams portal-hosted media (currently the name pronunciation clip) that the
// browser can't request directly, since it needs the Synergy session cookie
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const required = ["district_url", "username", "password", "path"];
    if (required.some((field) => !body[field])) {
      return NextResponse.json(
        { error: `${required.join(", ")} are required` },
        { status: 400 },
      );
    }
    const client = new SynergyClient(
      normalizeDomain(body.district_url),
      String(body.username),
      String(body.password),
    );
    const { body: bytes, contentType } = await client.getWebAsset(
      String(body.path),
    );
    return new NextResponse(bytes, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: routeErrorMessage(err) },
      { status: 500 },
    );
  }
}

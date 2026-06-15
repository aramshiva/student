// Shared plumbing for the /api/synergy/* POST routes. Every route takes the
// caller's StudentVue credentials in the JSON body, talks to the district's
// Synergy server, and returns the upstream payload as JSON.
import { NextResponse } from "next/server";
import { SynergyClient } from "@/lib/synergy";

export type SynergyRequestBody = Record<string, unknown> & {
  district_url: string;
  username: string;
  password: string;
};

export interface SynergyRouteContext {
  body: SynergyRequestBody;
  // district host with scheme/trailing slash stripped, e.g. "wa-bsd405-psv.edupoint.com"
  domain: string;
  client: SynergyClient;
}

export function normalizeDomain(districtUrl: unknown): string {
  return String(districtUrl)
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
}

export function routeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError") return "Request timed out";
    if (err.message === "fetch failed") {
      const code = (err as { cause?: { code?: string } }).cause?.code;
      return code ? `Fetch failed (${code})` : "Fetch failed";
    }
    return err.message;
  }
  return "Unknown error";
}

// many Synergy methods wrap their payload in a single root key
export function unwrapKey(raw: unknown, key: string): unknown {
  if (raw && typeof raw === "object" && key in raw) {
    return (raw as Record<string, unknown>)[key];
  }
  return raw;
}

function formatRequired(fields: string[]): string {
  if (fields.length === 1) return `${fields[0]} is required`;
  return `${fields.slice(0, -1).join(", ")}, and ${fields[fields.length - 1]} are required`;
}

export function synergyRoute(
  handler: (ctx: SynergyRouteContext) => Promise<unknown>,
  options: { required?: string[] } = {},
) {
  return async function POST(req: Request) {
    try {
      const body = (await req.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;
      if (!body || typeof body !== "object") {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 },
        );
      }

      const required = [
        "district_url",
        "username",
        "password",
        ...(options.required ?? []),
      ];
      if (required.some((field) => !body[field])) {
        return NextResponse.json(
          { error: formatRequired(required) },
          { status: 400 },
        );
      }

      const domain = normalizeDomain(body.district_url);
      let client: SynergyClient | undefined;
      const ctx: SynergyRouteContext = {
        body: body as SynergyRequestBody,
        domain,
        get client() {
          client ??= new SynergyClient(
            domain,
            String(body.username),
            String(body.password),
          );
          return client;
        },
      };

      const data = await handler(ctx);
      return NextResponse.json(data ?? {}, { status: 200 });
    } catch (err: unknown) {
      return NextResponse.json(
        { error: routeErrorMessage(err) },
        { status: 500 },
      );
    }
  };
}

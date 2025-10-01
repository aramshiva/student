import { NextRequest, NextResponse } from "next/server";
import { SynergyClient } from "@/lib/synergy";

const ZIP_REGEX = /^[0-9]{5}$/;

export async function GET(_req: NextRequest, context: { params: Promise<{ zip: string }> }) {
  const params = await context.params;
  const zip = (params.zip || "").trim();
  if (!zip) {
    return NextResponse.json({ error: "Missing zip" }, { status: 400 });
  }
  if (!ZIP_REGEX.test(zip)) {
    return NextResponse.json({ error: "Invalid zip format. Expect 5 digits" }, { status: 400 });
  }
  try {
    const districts = await SynergyClient.districtLookup(zip);
    return NextResponse.json(
      {
        zip,
        count: districts.length,
        districts: districts.map(d => ({
          name: d.name,
          url: d.host.replace(/\/$/, ""),
          address: d.address,
          zipcode: (d.address.match(/(\d{5})(?:-\d{4})?$/)?.[1]) || null,
        })),
        source: "remote",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=1800"
        }
      }
    );
  } catch (e) {
    const message = (e as Error).message || "Remote district lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { searchDistrictsLocal } from "@/lib/districts";

const ZIP_REGEX = /^[0-9]{5}(?:-[0-9]{4})?$/; // zip code validation

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zip = (searchParams.get("zip") || "").trim();
  if (!zip) {
    return NextResponse.json(
      { error: "Missing required parameter 'zip'" },
      { status: 400 },
    );
  }
  if (!ZIP_REGEX.test(zip)) {
    return NextResponse.json(
      { error: "Invalid zip format. Expect 5 digits or ZIP+4" },
      { status: 400 },
    );
  }
  try {
    const radiusParam = searchParams.get("radius");
    const nameParam = searchParams.get("name");
    const baseRadius = radiusParam ? Number(radiusParam) : 0;
    const radius = isNaN(baseRadius) ? 0 : Math.min(Math.max(baseRadius, 0), 50);
    const searchRes = searchDistrictsLocal({ zip: zip.slice(0,5), radius, name: nameParam || undefined });

    return NextResponse.json(
      {
        zip,
        count: searchRes.results.length,
        fuzzy: searchRes.fuzzyZip,
        searchedZips: searchRes.searchedZips,
        districts: searchRes.results.map((d) => ({
          name: d.name,
          url: d.parentVueUrl,
          address: d.address,
          zipcode: d.zipcode || null,
        })),
        source: "local",
        radiusSearched: radius,
        nameFilter: nameParam || null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": searchRes.fuzzyZip
            ? "public, max-age=600, stale-while-revalidate=3600"
            : "public, max-age=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "District lookup failed" },
      { status: 500 },
    );
  }
}

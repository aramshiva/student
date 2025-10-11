import { NextRequest, NextResponse } from "next/server";
import { getStudentNameFromDistrict } from "@/lib/name";
import { getCredentialsFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const credentials = await getCredentialsFromRequest(req);
    
    if (!credentials) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const name = await getStudentNameFromDistrict({
      districtBase: credentials.district_url.replace(/\/$/, ""),
      userId: credentials.username,
      password: credentials.password,
    });

    const response = NextResponse.json({ name }, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Name fetch error:', error instanceof Error ? error.message : 'Unknown error');
    
    const response = NextResponse.json(
      { error: "Unable to fetch student name" },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
}

import { NextResponse } from 'next/server';
import { SynergyClient } from '@/lib/synergy';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { district_url, username, password } = await req.json();

    if (!district_url || !username || !password) {
      return NextResponse.json(
        { error: 'district_url, username, and password are required' },
        { status: 400 }
      );
    }

    const normalizedDomain = String(district_url)
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/$/, '');

    const client = new SynergyClient(normalizedDomain, username, password);
    const data = await client.getStudentInfo();
    
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

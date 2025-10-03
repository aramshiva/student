import { NextRequest } from 'next/server';
import { getTestAnalysis } from '@/lib/testAnalysis';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Expected application/json body' }), { status: 415 });
    }
    const body = await req.json().catch(() => null) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }
    const { username, password, district_url } = body;
    if (!username || !password || !district_url) {
      return new Response(JSON.stringify({ error: 'Missing username, password or district_url' }), { status: 400 });
    }

    const trimmed = String(district_url).trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return new Response(JSON.stringify({ error: 'district_url must start with http(s)://' }), { status: 400 });
    }

    const analysis = await getTestAnalysis({
      districtBase: trimmed.replace(/\/$/, ''),
      userId: String(username),
      password: String(password),
    });

    return new Response(JSON.stringify({ analysis }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'Unable to fetch test analysis' }), { status: 500 });
  }
}

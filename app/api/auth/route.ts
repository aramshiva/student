import { NextRequest, NextResponse } from 'next/server';
import { encryptCredentials, createAuthCookie, StudentCredentials } from '@/lib/auth';

function validateDistrictUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return false;
    }
    
    const hostname = parsedUrl.hostname.toLowerCase();
    
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname === '::1' ||
      hostname.includes('169.254.')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, district_url } = body;

    if (!username || !password || !district_url) {
      return NextResponse.json(
        { error: 'Missing required fields: username, password, district_url' },
        { status: 400 }
      );
    }

    if (typeof username !== 'string' || typeof password !== 'string' || typeof district_url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid credential format' },
        { status: 400 }
      );
    }

    // Validate district URL to prevent SSRF attacks
    if (!validateDistrictUrl(district_url)) {
      return NextResponse.json(
        { error: 'Invalid district URL format' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const testResponse = await fetch(`${district_url}/Service/PXPCommunication.asmx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://edupoint.com/webservices/ProcessWebServiceRequest',
          'User-Agent': 'StudentVUE-Client/1.0'
        },
        body: `<?xml version="1.0" encoding="utf-8"?>
          <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
              <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">
                <userID>${username}</userID>
                <password>${password}</password>
                <skipLoginLog>true</skipLoginLog>
                <parent>false</parent>
                <webServiceHandleName>PXPWebServices</webServiceHandleName>
                <methodName>StudentInfo</methodName>
                <paramStr></paramStr>
              </ProcessWebServiceRequest>
            </soap:Body>
          </soap:Envelope>`,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!testResponse.ok) {
        return NextResponse.json(
          { error: 'Invalid credentials or district URL' },
          { status: 401 }
        );
      }

      const testText = await testResponse.text();
      if (testText.includes('Invalid user id or password') || testText.includes('Authentication_InvalidUserIdOrPassword')) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - district server not responding' },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to connect to district server' },
        { status: 503 }
      );
    }

    const credentials: StudentCredentials = { username, password, district_url };
    const token = await encryptCredentials(credentials);

    const response = NextResponse.json(
      { success: true, message: 'Authentication successful' },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', createAuthCookie(token));
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Authentication error:', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
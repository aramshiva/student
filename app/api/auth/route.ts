import { NextRequest, NextResponse } from 'next/server';
import { encryptCredentials, createAuthCookie, StudentCredentials } from '@/lib/auth';

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

    const testResponse = await fetch(`${district_url}/Service/PXPCommunication.asmx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://edupoint.com/webservices/ProcessWebServiceRequest'
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
        </soap:Envelope>`
    });

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
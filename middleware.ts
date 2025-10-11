import { NextResponse } from 'next/server';

export function middleware() {
  const response = NextResponse.next();
  
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cloud.umami.is; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  );
  
  response.headers.set('X-Frame-Options', 'DENY');
  
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
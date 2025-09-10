import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip middleware for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next()
  }

  // Add security headers
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Add cache control for dynamic pages
  if (request.nextUrl.pathname.startsWith('/auth/') ||
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/household') ||
      request.nextUrl.pathname.startsWith('/business') ||
      request.nextUrl.pathname.startsWith('/debts') ||
      request.nextUrl.pathname.startsWith('/reports') ||
      request.nextUrl.pathname.startsWith('/settings')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - icon files
     * - sitemap.xml (sitemap)
     * - robots.txt (robots file)
     * - Other static files (files with extensions)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-|sitemap.xml|robots.txt|.*\\.).*)$',
  ],
}
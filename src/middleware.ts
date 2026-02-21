import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

/**
 * Next.js Middleware for route protection.
 * 
 * NOTE: Since Zustand persists to localStorage, which is NOT available in Middleware (Edge runtime),
 * we typically use cookies for session tracking if we want true server-side protection.
 * 
 * For this Phase 1, we will implement a "soft" client-side guard in an AuthProvider,
 * but this Middleware acts as a placeholder for when we implement cookie-based auth.
 */
export function middleware(request: NextRequest) {
  // Path matching logic can go here
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

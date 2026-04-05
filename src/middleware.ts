import { NextResponse, type NextRequest } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', 
  '/login',
  '/system-admin/login',
  '/forgot-password'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth token cookie
  const authToken = request.cookies.get('auth-token');

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // If trying to access protected route without token, redirect to login
  if (!isPublicRoute && !authToken) {
    const url = request.nextUrl.clone();
    // Default to main login. Or could distinguish if system-admin based on path
    url.pathname = pathname.startsWith('/system-admin') ? '/system-admin/login' : '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // If trying to access login while already authenticated, redirect to app
  if (isPublicRoute && authToken && (pathname === '/login' || pathname === '/system-admin/login')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === '/system-admin/login' ? '/system-admin/dashboard' : '/overview';
    return NextResponse.redirect(url);
  }

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

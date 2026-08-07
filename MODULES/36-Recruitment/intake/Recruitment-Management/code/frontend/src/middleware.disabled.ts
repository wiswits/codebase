import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/recruitment',
  '/recruitment/dashboard',
  '/recruitment/vacancies',
  '/recruitment/applicants',
  '/recruitment/pipeline',
  '/recruitment/interviews',
  '/recruitment/offers',
];

// Public routes
const publicRoutes = ['/', '/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth cookie (mock auth)
  const authCookie = request.cookies.get('auth_token');
  const isAuthenticated = !!authCookie;

  // Allow public routes
  if (publicRoutes.includes(pathname) || pathname === '/') {
    // If authenticated and trying to access login, redirect to dashboard
    if (pathname === '/login' && isAuthenticated) {
      return NextResponse.redirect(new URL('/recruitment/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
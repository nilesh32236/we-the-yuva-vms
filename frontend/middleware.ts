import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';
import { isPublicRoute } from './lib/public-routes';
import { ROLE_ROUTES, ROLE_ROUTE_PREFIXES, ONBOARDING_ROUTES } from './lib/shared/permissions';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through (auth pages, landing, etc.)
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;

  // No token → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Decode JWT to verify role-based access
  try {
    const payload = decodeJwt(token);

    // Expired token → redirect to login
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = payload.role as string;

    // Allow onboarding routes for any authenticated user
    if (ONBOARDING_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.next();
    }

    // Check if user's role permits the current route
    const allowedPrefixes = ROLE_ROUTE_PREFIXES[role];
    if (allowedPrefixes?.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next();
    }

    // Unauthorized for this route → redirect to own dashboard
    const dashboardUrl = new URL(ROLE_ROUTES[role] ?? '/login', request.url);
    return NextResponse.redirect(dashboardUrl);
  } catch {
    // Invalid token → redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest\\.json|icons|serwist).*)',
  ],
};

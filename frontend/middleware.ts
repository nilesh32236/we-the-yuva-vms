import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt, jwtVerify } from 'jose';

// NOTE: Route lists below are duplicated from:
//   - frontend/lib/public-routes.ts
//   - frontend/lib/shared/permissions.ts
// Keep in sync when routes change.

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/faq',
  '/privacy',
  '/terms',
  '/opportunities',
  '/blog',
  '/login',
  '/register',
  '/verify-otp',
];

// Canonical source: frontend/lib/shared/permissions.ts
const ROLE_ROUTES: Record<string, string> = {
  VOLUNTEER: '/volunteer/dashboard',
  COORDINATOR: '/coordinator/dashboard',
  ADMIN: '/admin/dashboard',
  OBSERVER: '/observer/dashboard',
  ORGANIZATION_ADMIN: '/organization/dashboard',
  PLATFORM_MANAGER: '/admin/dashboard',
};

// Canonical source: frontend/lib/shared/permissions.ts
const ROLE_PREFIXES: Record<string, string[]> = {
  VOLUNTEER: ['/volunteer'],
  COORDINATOR: ['/coordinator'],
  ORGANIZATION_ADMIN: ['/organization', '/register-organization'],
  ADMIN: ['/admin'],
  PLATFORM_MANAGER: ['/admin'],
  OBSERVER: ['/observer'],
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => {
    if (r === '/') return pathname === '/';
    return pathname === r || pathname.startsWith(`${r}/`);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = process.env.JWT_ACCESS_SECRET;
    let payload: { exp?: number; role?: string };

    if (secret) {
      const result = await jwtVerify(token, new TextEncoder().encode(secret), {
        algorithms: ['HS256'],
        issuer: 'we-the-yuva-api',
      });
      payload = result.payload as { exp?: number; role?: string };
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.redirect(new URL('/login', request.url));
    } else {
      payload = decodeJwt(token);
    }

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = payload.role as string | undefined;
    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const allowedPrefixes = ROLE_PREFIXES[role];
    if (allowedPrefixes && !allowedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.redirect(new URL(ROLE_ROUTES[role] ?? '/login', request.url));
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|api|serwist).*)',
  ],
};

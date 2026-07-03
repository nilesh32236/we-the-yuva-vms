import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/verify-otp',
  '/offline',
  '/scan',
  '/consent',
  '/setup-profile',
];
const ONBOARDING_ROUTES = ['/consent', '/setup-profile'];

const ROLE_ROUTES: Record<string, string> = {
  VOLUNTEER: '/volunteer',
  COORDINATOR: '/coordinator',
  ORGANIZATION_ADMIN: '/organization',
  PLATFORM_MANAGER: '/admin',
  ADMIN: '/admin',
  OBSERVER: '/observer',
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static assets
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  const accessToken = req.cookies.get('access_token')?.value;

  if (!accessToken) {
    if (!isPublic) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  try {
    const jwtSecret = process.env.JWT_ACCESS_SECRET;
    if (!jwtSecret) {
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('access_token');
      return response;
    }
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(accessToken, secret, {
      algorithms: ['HS256'],
    });
    const role = payload.role as string;
    const rolePrefix = ROLE_ROUTES[role];

    if (!rolePrefix) {
      // Unknown role — clear cookie and redirect
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('access_token');
      return response;
    }

    // Redirect authenticated users away from public pages (including landing '/') and auth pages
    if (isPublic && !ONBOARDING_ROUTES.some((r) => pathname === r)) {
      return NextResponse.redirect(new URL(`${rolePrefix}/dashboard`, req.url));
    }

    // Prevent cross-role access
    const isOnWrongRoleRoute = Object.values(ROLE_ROUTES).some(
      (prefix) => pathname.startsWith(prefix) && !pathname.startsWith(rolePrefix)
    );

    if (isOnWrongRoleRoute) {
      return NextResponse.redirect(new URL(`${rolePrefix}/dashboard`, req.url));
    }

    return NextResponse.next();
  } catch {
    // Token expired or invalid — clear and redirect
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('access_token');
    return response;
  }
}

export const config = {
  // Exclude: Next.js internals, static files, PWA assets (sw.js, workbox, manifest, icons)
  matcher: [
    '/((?!api|_next/static|_next/image|icons|manifest\\.json|sw\\.js|workbox-.*|.*\\.png$|.*\\.svg$|.*\\.ico$|.*\\.webmanifest$).*)',
  ],
};

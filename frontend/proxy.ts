import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/verify-otp',
  '/offline',
  '/scan',
  '/verify',
  '/about',
  '/contact',
  '/faq',
  '/privacy',
  '/terms',
  '/opportunities',
  '/blog',
];
// Truly public informational pages — no redirect even when authenticated.
// /scan (self-service event check-in for logged-in coordinators/volunteers via
// deep link or QR) and /offline (PWA offline fallback) must render for BOTH
// anonymous and authenticated visitors — the server still enforces
// EVENT_CHECKIN on POST /events/:id/checkin.
const TRULY_PUBLIC = [
  '/about',
  '/contact',
  '/faq',
  '/privacy',
  '/terms',
  '/opportunities',
  '/blog',
  '/verify',
  '/scan',
  '/offline',
];
const ONBOARDING_ROUTES = ['/consent', '/setup-profile'];

// Short-lived marker set when the proxy performs a server-side token refresh
// redirect, used to break a potential refresh→redirect loop.
const PROXY_REFRESHED_COOKIE = '__proxy_refreshed';

const ROLE_ROUTES: Record<string, string> = {
  VOLUNTEER: '/volunteer',
  COORDINATOR: '/coordinator',
  ORGANIZATION_ADMIN: '/organization',
  PLATFORM_MANAGER: '/admin',
  ADMIN: '/admin',
  OBSERVER: '/observer',
};

// Attempt a server-side token refresh using the (HttpOnly) refresh cookie so a
// full page load after access-token expiry keeps the session alive instead of
// hard-logging-out. Returns the Set-Cookie headers to propagate, or null.
async function tryRefresh(req: NextRequest): Promise<string[] | null> {
  if (!req.cookies.get('refresh_token')) return null;
  try {
    const refreshRes = await fetch(new URL('/api/v1/auth/refresh', req.url), {
      method: 'POST',
      headers: {
        cookie: req.headers.get('cookie') ?? '',
      },
      redirect: 'manual',
    });
    if (!refreshRes.ok) return null;
    const setCookies = refreshRes.headers.getSetCookie();
    return setCookies.length > 0 ? setCookies : null;
  } catch {
    return null;
  }
}

function withCookies(response: NextResponse, setCookies: string[]): NextResponse {
  for (const c of setCookies) {
    response.headers.append('Set-Cookie', c);
  }
  return response;
}

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
      if (isPublic) {
        const response = NextResponse.next();
        response.cookies.delete('access_token');
        return response;
      }
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
      // Unknown role — clear cookie and redirect (let public pages through)
      if (isPublic) {
        const response = NextResponse.next();
        response.cookies.delete('access_token');
        return response;
      }
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('access_token');
      return response;
    }

    // Redirect authenticated users away from login/auth public pages (not truly public info pages)
    if (isPublic && !TRULY_PUBLIC.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
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
    // Token expired or invalid — attempt a server-side refresh before falling
    // back to logout so sessions survive full page loads past the 15-min TTL.
    // Guard: only attempt the refresh once per navigation. If the previous
    // pass already refreshed and verification still fails (e.g. signing-secret
    // mismatch), redirect to login instead of looping refresh→redirect forever.
    if (req.cookies.get(PROXY_REFRESHED_COOKIE)?.value === '1') {
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('access_token');
      response.cookies.delete(PROXY_REFRESHED_COOKIE);
      return response;
    }

    const refreshedCookies = await tryRefresh(req);

    if (isPublic) {
      const response = NextResponse.next();
      if (refreshedCookies) {
        return withCookies(response, refreshedCookies);
      }
      response.cookies.delete('access_token');
      return response;
    }

    if (refreshedCookies) {
      // Reload the requested page with the freshly rotated cookies — the proxy
      // re-runs on the redirect and verifies the new access token.
      const response = withCookies(NextResponse.redirect(req.url), refreshedCookies);
      response.cookies.set(PROXY_REFRESHED_COOKIE, '1', {
        path: '/',
        httpOnly: true,
        maxAge: 30,
        sameSite: 'lax',
      });
      return response;
    }

    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('access_token');
    return response;
  }
}

export const config = {
  // Exclude: Next.js internals, static files, PWA assets (sw.js, workbox, manifest, icons)
  matcher: [
    '/((?!api|_next/static|_next/image|serwist|icons|manifest\\.json|sw\\.js|workbox-.*|.*\\.png$|.*\\.svg$|.*\\.ico$|.*\\.webmanifest$).*)',
  ],
};

export const PUBLIC_ROUTES = [
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
  '/offline',
  '/scan',
  '/verify',
];

// NOTE (audit #203): /scan (self-service event check-in) and /verify
// (public certificate verification) are intentionally public. /scan is a
// mutating action, so it relies on the server enforcing the session, the
// qrToken and EVENT_CHECKIN (POST /events/:id/checkin → requireAuth +
// requirePermission(EVENT_CHECKIN)) — this is by design; moving it behind a
// role gate is a product decision tracked separately. /verify is a read-only
// marketing self-service page.

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => {
    if (r === '/') return pathname === '/';
    return pathname === r || pathname.startsWith(`${r}/`);
  });
}

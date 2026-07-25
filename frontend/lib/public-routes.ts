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
];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => {
    if (r === '/') return pathname === '/';
    return pathname === r || pathname.startsWith(`${r}/`);
  });
}

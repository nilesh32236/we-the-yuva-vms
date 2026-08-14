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

import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import 'nprogress/nprogress.css';
import './globals.css';
import { Providers } from './providers';
import { AppUpdatePrompt } from '@/components/shared/AppUpdatePrompt';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WeTheYuva VMS',
  description: 'Volunteer Management System — Connecting volunteers with purpose',
  manifest: '/manifest.json',
  // Apple PWA meta
  appleWebApp: {
    capable: true,
    title: 'WeTheYuva',
    statusBarStyle: 'black-translucent',
  },
  // Prevent phone number detection on iOS
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'WeTheYuva VMS',
    description: 'Volunteer Management System — Connecting volunteers with purpose',
    type: 'website',
    locale: 'en_IN',
    siteName: 'WeTheYuva',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WeTheYuva VMS',
    description: 'Volunteer Management System — Connecting volunteers with purpose',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#059669' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // critical for iPhone notch / Dynamic Island
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="bg-brand-bg text-brand-text font-body antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-xl focus:outline-none"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
        <AppUpdatePrompt />
      </body>
    </html>
  );
}

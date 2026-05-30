import type { Metadata, Viewport } from 'next';
import { Open_Sans, Poppins } from 'next/font/google';
import 'nprogress/nprogress.css';
import './globals.css';
import { Providers } from './providers';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
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
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // critical for iPhone notch / Dynamic Island
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${openSans.variable}`}>
      <body className="bg-brand-bg text-brand-text font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

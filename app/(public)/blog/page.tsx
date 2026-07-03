import type { Metadata } from 'next';
import { BlogPageClient } from './client';

export const metadata: Metadata = {
  title: 'Volunteer Stories & Updates | WeTheYuva Blog',
  description:
    'Read stories, insights, and updates from the WeTheYuva volunteer community across India.',
  openGraph: {
    title: 'Volunteer Stories & Updates | WeTheYuva Blog',
    description:
      'Read stories, insights, and updates from the WeTheYuva volunteer community across India.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'WeTheYuva',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Volunteer Stories & Updates | WeTheYuva Blog',
    description:
      'Read stories, insights, and updates from the WeTheYuva volunteer community across India.',
  },
};

export default function BlogPage() {
  return <BlogPageClient />;
}

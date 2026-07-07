import type { Metadata } from 'next';
import { BlogPostPageClient } from './client';

export function generateMetadata(): Metadata {
  return {
    title: 'Blog Post | WeTheYuva',
    description: 'Read this story on the WeTheYuva blog.',
    openGraph: {
      title: 'Blog Post | WeTheYuva',
      description: 'Read this story on the WeTheYuva blog.',
      type: 'article',
      locale: 'en_IN',
      siteName: 'WeTheYuva',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Blog Post | WeTheYuva',
      description: 'Read this story on the WeTheYuva blog.',
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogPostPageClient slug={slug} />;
}

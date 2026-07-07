import type { Metadata } from 'next';
import { BlogPostPageClient } from './client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = process.env.VERCEL_URL
      ? `${protocol}://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const res = await fetch(`${host}/api/v1/blog/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'Post Not Found | WeTheYuva Blog' };
    const json = await res.json();
    const post = json.data || json;
    return {
      title: `${post.title} | WeTheYuva Blog`,
      description: post.excerpt || 'Read this story on the WeTheYuva blog.',
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        locale: 'en_IN',
        siteName: 'WeTheYuva',
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
      },
    };
  } catch {
    return { title: 'WeTheYuva Blog' };
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogPostPageClient slug={slug} />;
}

import { Calendar, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  publishedAt: string;
  author: { name: string };
}

async function getLatestPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/blog?limit=3`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    return body.data ?? [];
  } catch {
    return [];
  }
}

export async function BlogPreview() {
  const posts = await getLatestPosts();

  if (posts.length === 0) return null;

  return (
    <section className="bg-brand-bg/50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-primary">
            Blog
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold text-brand-text sm:text-4xl">
            Latest from Our Blog
          </h2>
          <p className="mt-3 text-brand-muted">Stories, insights, and updates from the community.</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className={`card-hover group rounded-2xl border border-brand-border bg-brand-surface overflow-hidden ${i < 3 ? 'motion-safe:animate-fade-in-up' : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {post.featuredImage ? (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center">
                  <span className="text-brand-primary/30 font-heading font-bold text-4xl">WY</span>
                </div>
              )}
              <div className="p-5 space-y-2">
                <h3 className="font-heading font-semibold text-brand-text group-hover:text-brand-primary transition-colors duration-200 line-clamp-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-brand-muted line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-brand-muted pt-2">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" aria-hidden="true" /> {post.author.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="active-bounce inline-flex items-center gap-2 rounded-xl border border-brand-secondary bg-brand-surface px-6 py-3 text-sm font-semibold text-brand-primary transition-colors duration-200 hover:bg-brand-bg focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
          >
            View all posts
          </Link>
        </div>
      </div>
    </section>
  );
}

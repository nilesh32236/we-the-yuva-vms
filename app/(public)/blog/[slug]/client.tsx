'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Tag, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';

export function BlogPostPageClient({ slug }: { slug: string }) {
  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => api.get(`/blog/${slug}`).then((r) => r.data),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg py-12">
        <div className="mx-auto max-w-3xl px-4 space-y-4">
          <div className="h-8 w-32 bg-brand-border rounded animate-pulse" />
          <div className="h-10 w-3/4 bg-brand-border rounded animate-pulse" />
          <div className="h-4 w-1/3 bg-brand-border rounded animate-pulse" />
          <div className="h-64 bg-brand-border rounded-xl animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-brand-border rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-brand-bg py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-brand-muted">Post not found.</p>
          <Link href="/blog" className="text-brand-primary hover:underline mt-2 inline-block">
            Back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        <article className="space-y-6">
          <div className="space-y-3">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-brand-text">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-brand-muted">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" aria-hidden="true" /> {post.author?.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
              {post.category && (
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" /> {post.category}
                </span>
              )}
            </div>
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {post.featuredImage && (
            <div className="relative h-64 sm:h-96 rounded-xl overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="prose prose-sm sm:prose max-w-none text-brand-text leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </article>
      </div>
    </div>
  );
}

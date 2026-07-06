'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, Calendar, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Pagination from '@/components/shared/Pagination';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api';

export function BlogPageClient() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['blog-posts', page],
    queryFn: () => api.get('/blog', { params: { limit: 50, page } }).then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-brand-bg py-12 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-brand-text">Blog</h1>
          <p className="mt-3 text-brand-muted">
            Stories, insights, and updates from the WeTheYuva community.
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center">
            <BookOpen className="w-10 h-10 text-brand-muted mx-auto mb-3" aria-hidden="true" />
            <p className="text-brand-text font-medium">No posts yet</p>
            <p className="text-sm text-brand-muted mt-1">Check back soon for new content.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {data?.data?.map(
              (post: {
                id: string;
                title: string;
                slug: string;
                excerpt?: string;
                featuredImage?: string;
                tags: string[];
                author: { name: string };
                publishedAt: string;
              }) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden hover:shadow-lg transition-all group card-hover"
                >
                  {post.featuredImage && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5 space-y-2">
                    <h2 className="font-heading font-semibold text-brand-text group-hover:text-brand-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-brand-muted line-clamp-2">{post.excerpt}</p>
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
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-brand-bg text-brand-muted px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
              )}
            </div>
            <Pagination page={page} totalPages={data?.totalPages ?? 0} setPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

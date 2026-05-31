'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, Plus } from 'lucide-react';
import Link from 'next/link';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { api } from '../../../../lib/api';

export default function MyStoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-stories'],
    queryFn: () => api.get('/stories/published').then((r) => r.data),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl text-brand-text">My Stories</h1>
        <Link
          href="/volunteer/stories/new"
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Story
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-brand-muted mx-auto" />
          <p className="font-medium text-brand-text">No stories yet</p>
          <p className="text-sm text-brand-muted">
            Share your volunteer experience with the community
          </p>
          <Link
            href="/volunteer/stories/new"
            className="inline-block bg-brand-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            Write your first story
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {data?.data?.map(
            (story: {
              id: string;
              title: string;
              content: string;
              published: boolean;
              createdAt: string;
            }) => (
              <div
                key={story.id}
                className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-heading font-semibold text-brand-text">{story.title}</h2>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${story.published ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}
                  >
                    {story.published ? 'Published' : 'Pending review'}
                  </span>
                </div>
                <p className="text-sm text-brand-muted line-clamp-3">{story.content}</p>
                <p className="text-[10px] text-brand-muted">
                  {new Date(story.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

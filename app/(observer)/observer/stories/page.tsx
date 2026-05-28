'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { api } from '../../../../lib/api';

const CATEGORY_COLORS: Record<string, string> = {
  EDUCATION: 'bg-blue-100 text-blue-700',
  ENVIRONMENT: 'bg-green-100 text-green-700',
  HEALTH: 'bg-red-100 text-red-700',
  TECHNOLOGY: 'bg-cyan-100 text-cyan-700',
  COMMUNITY: 'bg-purple-100 text-purple-700',
  ARTS: 'bg-pink-100 text-pink-700',
  SPORTS: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function ObserverStoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['published-stories'],
    queryFn: () => api.get('/stories/published', { params: { limit: 50 } }).then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <h1 className="font-heading font-bold text-xl text-brand-text">Impact Stories</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-brand-muted mx-auto" />
          <p className="font-medium text-brand-text">No stories published yet</p>
          <p className="text-sm text-brand-muted">
            Check back soon for impact stories from our volunteers
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data?.data?.map(
            (story: {
              id: string;
              title: string;
              content: string;
              createdAt: string;
              user: { name: string };
            }) => (
              <div
                key={story.id}
                className="bg-white rounded-2xl border border-brand-border p-6 hover:shadow-md hover:border-brand-primary/30 transition-all duration-200"
              >
                <h2 className="font-heading font-semibold text-brand-text text-lg mb-1">
                  {story.title}
                </h2>
                <p className="text-xs text-brand-muted mb-3">{story.user.name}</p>
                <p className="text-sm text-brand-muted leading-relaxed">{story.content}</p>
                <p className="text-[10px] text-brand-muted mt-3">
                  {new Date(story.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

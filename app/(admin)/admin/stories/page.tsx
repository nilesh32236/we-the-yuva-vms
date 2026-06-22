'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../hooks/use-toast';
import { api } from '../../../../lib/api';

export default function AdminStoriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stories'],
    queryFn: () => api.get('/stories/all', { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 15_000,
  });

  const moderateMut = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      api.patch(`/stories/${id}/moderate`, { published }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-stories'] });
      toast({ title: 'Story updated' });
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/stories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-stories'] });
      toast({ title: 'Story deleted' });
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-heading font-bold text-xl text-brand-text">Story Moderation</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-brand-border p-12 text-center">
          <BookOpen className="w-10 h-10 text-brand-muted mx-auto mb-3" />
          <p className="font-medium text-brand-text">No stories submitted yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.data?.map(
            (story: {
              id: string;
              title: string;
              content: string;
              published: boolean;
              createdAt: string;
              user: { name: string; email: string | null };
            }) => (
              <div
                key={story.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-brand-border p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-heading font-semibold text-brand-text">{story.title}</h2>
                    <p className="text-xs text-brand-muted">
                      By {story.user.name} {story.user.email ? `(${story.user.email})` : ''} ·{' '}
                      {new Date(story.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${story.published ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}
                  >
                    {story.published ? 'Published' : 'Pending'}
                  </span>
                </div>

                <p className="text-sm text-brand-muted line-clamp-3">{story.content}</p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      moderateMut.mutate({ id: story.id, published: !story.published })
                    }
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border border-brand-border hover:bg-brand-bg transition-colors cursor-pointer"
                  >
                    {story.published ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    {story.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(story.id)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                  {confirmDelete === story.id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
                        <h3 className="font-semibold text-lg mb-2">Confirm</h3>
                        <p className="text-sm text-gray-600 mb-4">Delete this story?</p>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="px-4 py-2 text-sm rounded-lg border"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteMut.mutate(story.id);
                              setConfirmDelete(null);
                            }}
                            className="px-4 py-2 text-sm rounded-lg bg-red-600 dark:bg-red-700 text-white"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

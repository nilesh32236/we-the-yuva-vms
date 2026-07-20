'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, CheckCircle, ShieldAlert, Trash2, User, XCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const StoryDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  mediaUrl: z.string().nullable(),
  published: z.boolean(),
  createdAt: z.string(),
  user: z.object({ name: z.string(), email: z.string() }),
});
type StoryDetail = z.infer<typeof StoryDetailSchema>;

export default function AdminStoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showModerateConfirm, setShowModerateConfirm] = useState(false);

  const {
    data: story,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-story-detail', id],
    queryFn: () =>
      api.get(`/admin/stories/${id}`).then((r) => StoryDetailSchema.parse(r.data)),
    enabled: !!id,
  });

  const moderateMut = useMutation({
    mutationFn: (published: boolean) => api.patch(`/stories/${id}/moderate`, { published }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-story-detail', id] });
      qc.invalidateQueries({ queryKey: ['admin-stories'] });
      toast({ title: 'Story updated' });
    },
    onError: (err: { normalizedMessage?: string }) =>
      toast({
        title: 'Error',
        description: err.normalizedMessage ?? 'Something went wrong',
        variant: 'destructive',
      }),
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/stories/${id}`),
    onSuccess: () => {
      toast({ title: 'Story deleted' });
      router.push('/admin/stories');
    },
    onError: (err: { normalizedMessage?: string }) =>
      toast({
        title: 'Error',
        description: err.normalizedMessage ?? 'Something went wrong',
        variant: 'destructive',
      }),
  });

  if (isLoading) {
    return (
      <div role="status" aria-busy="true" className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-48 bg-brand-bg rounded-lg" />
        <div className="h-12 bg-brand-surface rounded-2xl border border-brand-border" />
        <div className="h-64 bg-brand-surface rounded-2xl border border-brand-border" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="text-center py-20">
        <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-40" />
        <p className="font-medium text-brand-text mb-1">Failed to load story</p>
        <Button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 mt-4 min-h-[44px]"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 text-brand-muted mx-auto mb-4 opacity-20" />
        <p className="font-medium text-brand-text">Story not found</p>
        <Link
          href="/admin/stories"
          className="text-brand-primary text-sm mt-2 inline-block hover:underline"
        >
          Back to stories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/admin/stories"
        className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Stories
      </Link>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <p className="font-semibold text-brand-text">{story.user.name}</p>
            <p className="text-xs text-brand-muted">{story.user.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="font-heading font-bold text-2xl text-brand-text">{story.title}</h1>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${story.published ? 'bg-brand-primary/10 text-brand-primary' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}
          >
            {story.published ? 'Published' : 'Pending'}
          </span>
        </div>

        <p className="text-xs text-brand-muted mb-4">
          Submitted{' '}
          {new Date(story.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        {story.mediaUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-brand-border">
            <Image
              src={story.mediaUrl}
              alt={story.title}
              width={800}
              height={450}
              className="w-full object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {story.content.split('\n').map((paragraph, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: stable order from static text split
            <p key={i} className="text-sm text-brand-muted leading-relaxed mb-3 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <h2 className="font-heading font-bold text-lg text-brand-text mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => setShowModerateConfirm(true)}
            loading={moderateMut.isPending}
          >
            {story.published ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {story.published ? 'Unpublish' : 'Approve & Publish'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            className="min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            Delete Story
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showModerateConfirm}
        title={story.published ? 'Unpublish Story' : 'Approve & Publish Story'}
        message={`${story.published ? 'Unpublish' : 'Publish'} "${story.title}"?`}
        confirmLabel={story.published ? 'Unpublish' : 'Publish'}
        loading={moderateMut.isPending}
        onConfirm={() => {
          moderateMut.mutate(!story.published);
          setShowModerateConfirm(false);
        }}
        onCancel={() => setShowModerateConfirm(false)}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Story"
        message={`Delete "${story.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate()}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

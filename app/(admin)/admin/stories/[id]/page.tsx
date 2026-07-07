'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, CheckCircle, XCircle, Trash2, ShieldAlert, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface StoryDetail {
  id: string;
  title: string;
  content: string;
  mediaUrl: string | null;
  published: boolean;
  createdAt: string;
  user: { name: string; email: string };
}

export default function AdminStoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: story, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-story-detail', id],
    queryFn: () => api.get(`/admin/stories/${id}`).then((r) => r.data as StoryDetail),
    enabled: !!id,
  });

  const moderateMut = useMutation({
    mutationFn: (published: boolean) => api.patch(`/stories/${id}/moderate`, { published }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-story-detail', id] });
      qc.invalidateQueries({ queryKey: ['admin-stories'] });
      toast({ title: 'Story updated' });
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/stories/${id}`),
    onSuccess: () => {
      toast({ title: 'Story deleted' });
      router.push('/admin/stories');
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-48 bg-brand-bg rounded-lg" />
        <div className="h-12 bg-brand-surface rounded-2xl border border-brand-border" />
        <div className="h-64 bg-brand-surface rounded-2xl border border-brand-border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-40" />
        <p className="font-medium text-brand-text mb-1">Failed to load story</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary cursor-pointer transition-colors shadow-sm mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 text-brand-muted mx-auto mb-4 opacity-20" />
        <p className="font-medium text-brand-text">Story not found</p>
        <Link href="/admin/stories" className="text-brand-primary text-sm mt-2 inline-block hover:underline">
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
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${story.published ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}
          >
            {story.published ? 'Published' : 'Pending'}
          </span>
        </div>

        <p className="text-xs text-brand-muted mb-4">
          Submitted {new Date(story.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
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
          <button
            type="button"
            onClick={() => moderateMut.mutate(!story.published)}
            disabled={moderateMut.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary cursor-pointer transition-colors disabled:opacity-50 shadow-sm"
          >
            {story.published ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {moderateMut.isPending ? 'Processing...' : story.published ? 'Unpublish' : 'Approve & Publish'}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-brand-error text-brand-error text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Story
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Story"
        message={`Delete "${story.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate()}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

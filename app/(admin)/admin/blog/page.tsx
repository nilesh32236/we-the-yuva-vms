'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, CheckCircle, FileText, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import Pagination from '@/components/shared/Pagination';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function AdminBlogPage() {
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blog-posts', page],
    queryFn: () => api.get('/blog/all', { params: { limit: 50, page } }).then((r) => r.data),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/blog/${id}/publish`).then((r) => r.data),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      const blogUrl = `${window.location.origin}/blog/${post.slug}`;
      toast({
        title: 'Post published!',
        description: (
          <a
            href={blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            View post &rarr;
          </a>
        ) as unknown as string,
      });
    },
    onError: (err) => {
      const message =
        (err as { normalizedMessage?: string })?.normalizedMessage ?? 'Failed to publish';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/blog/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({ title: 'Post archived.' });
    },
    onError: (err) => {
      const message =
        (err as { normalizedMessage?: string })?.normalizedMessage ?? 'Failed to archive';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/blog/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({ title: 'Post deleted.' });
    },
    onError: (err) => {
      const message =
        (err as { normalizedMessage?: string })?.normalizedMessage ?? 'Failed to delete';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const statusColor: Record<string, string> = {
    DRAFT: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    PUBLISHED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    ARCHIVED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl text-brand-text">Blog Posts</h1>
        <Link href="/admin/blog/new">
          <Button type="button" variant="primary">
            <Plus className="w-4 h-4" /> New Post
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-brand-muted mx-auto" />
          <p className="font-medium text-brand-text">No posts yet</p>
          <Link href="/admin/blog/new">
            <Button type="button" variant="primary">
              Create your first post
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.data?.map(
            (post: {
              id: string;
              title: string;
              status: string;
              slug: string;
              author: { name: string };
              createdAt: string;
              category?: string;
            }) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 bg-brand-surface rounded-xl border border-brand-border card-hover"
              >
                <Link href={`/admin/blog/${post.id}/edit`} className="min-w-0 flex-1">
                  <h2 className="font-medium text-brand-text truncate">{post.title}</h2>
                  <p className="text-xs text-brand-muted mt-0.5">
                    by {post.author.name} &middot;{' '}
                    {new Date(post.createdAt).toLocaleDateString('en-IN')}
                    {post.category && <>&middot; {post.category}</>}
                  </p>
                </Link>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {post.status === 'DRAFT' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={publishMutation.isPending && publishMutation.variables === post.id}
                      onClick={(e) => {
                        e.preventDefault();
                        publishMutation.mutate(post.id);
                      }}
                    >
                      <CheckCircle className="w-4 h-4" /> Publish
                    </Button>
                  )}
                  {post.status === 'PUBLISHED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={archiveMutation.isPending && archiveMutation.variables === post.id}
                      onClick={(e) => {
                        e.preventDefault();
                        archiveMutation.mutate(post.id);
                      }}
                    >
                      <Archive className="w-4 h-4" /> Archive
                    </Button>
                  )}
                  <Button
                    variant="icon"
                    size="sm"
                    loading={deleteMutation.isPending && deleteMutation.variables === post.id}
                    onClick={(e) => {
                      e.preventDefault();
                      if (window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
                        deleteMutation.mutate(post.id);
                      }
                    }}
                    aria-label={`Delete ${post.title}`}
                  >
                    <Trash2 className="w-4 h-4 text-brand-error" />
                  </Button>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[post.status] ?? ''}`}
                  >
                    {post.status}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      )}
      <Pagination page={page} totalPages={data?.totalPages ?? 0} setPage={setPage} />
    </div>
  );
}

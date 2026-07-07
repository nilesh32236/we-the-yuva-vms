'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BlogPostForm } from '@/components/blog/BlogPostForm';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { CreateBlogPostInput } from '@/lib/shared';

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  PUBLISHED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  ARCHIVED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post-admin', id],
    queryFn: () => api.get(`/blog/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const publishMutation = useMutation({
    mutationFn: () => api.patch(`/blog/${id}/publish`).then((r) => r.data),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['blog-post-admin', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      const blogUrl = `${window.location.origin}/blog/${post.slug}`;
      toast({
        title: 'Post published!',
        description: (
          <a href={blogUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
            View post &rarr;
          </a>
        ) as unknown as string,
      });
    },
    onError: (err) => {
      const message = (err as { normalizedMessage?: string })?.normalizedMessage ?? 'Failed to publish';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => api.patch(`/blog/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-post-admin', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({ title: 'Post archived.' });
    },
    onError: (err) => {
      const message = (err as { normalizedMessage?: string })?.normalizedMessage ?? 'Failed to archive';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const handleSubmit = async (data: CreateBlogPostInput) => {
    try {
      await api.put(`/blog/${id}`, data);
      toast({ title: 'Post updated!' });
      router.push('/admin/blog');
    } catch (err) {
      const message = (err as { normalizedMessage?: string })?.normalizedMessage ?? 'Failed to update post';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-5">
        <div className="h-5 w-24 bg-brand-border rounded animate-pulse" />
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-brand-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl space-y-5">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center">
          <p className="text-brand-muted">Post not found.</p>
        </div>
      </div>
    );
  }

  const defaultValues: Partial<CreateBlogPostInput> = {
    title: post.title,
    excerpt: post.excerpt ?? undefined,
    content: post.content,
    featuredImage: post.featuredImage ?? undefined,
    tags: post.tags ?? [],
    category: post.category ?? undefined,
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-heading font-bold text-xl text-brand-text">Edit Post</h1>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge[post.status] ?? ''}`}>
            {post.status}
          </span>
        </div>

        <BlogPostForm defaultValues={defaultValues} onSubmit={handleSubmit} submitLabel="Update Post" />

        <hr className="my-6 border-brand-border" />

        <div className="flex items-center gap-3">
          {post.status === 'DRAFT' && (
            <Button
              variant="primary"
              loading={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              <CheckCircle className="w-4 h-4" /> Publish
            </Button>
          )}
          {post.status === 'PUBLISHED' && (
            <Button variant="outline" loading={archiveMutation.isPending} onClick={() => archiveMutation.mutate()}>
              <Archive className="w-4 h-4" /> Archive
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

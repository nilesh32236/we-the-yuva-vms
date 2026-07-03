'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BlogPostForm } from '@/components/blog/BlogPostForm';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { CreateBlogPostInput } from '@/lib/shared';

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post-admin', id],
    queryFn: () => api.get(`/blog/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const handleSubmit = async (data: CreateBlogPostInput) => {
    try {
      await api.put(`/blog/${id}`, data);
      toast({ title: 'Post updated!' });
      router.push('/admin/blog');
    } catch (err) {
      const message =
        (err as { normalizedMessage?: string })?.normalizedMessage ?? 'Failed to update post';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-5">
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
          <div className="h-6 w-40 bg-brand-bg rounded animate-pulse mb-5" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-brand-bg rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl space-y-5">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center">
          <p className="text-brand-muted">Post not found</p>
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
        <h1 className="font-heading font-bold text-xl text-brand-text mb-5">Edit Post</h1>
        <BlogPostForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitLabel="Update Post"
        />
      </div>
    </div>
  );
}

'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BlogPostForm } from '../../../../../components/blog/BlogPostForm';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';
import type { CreateBlogPostInput } from '@/lib/shared';

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (data: CreateBlogPostInput) => {
    try {
      await api.post('/blog', data);
      toast({ title: 'Post created!', description: 'Your draft has been saved.' });
      router.push('/admin/blog');
    } catch (err) {
      const message = (err as { normalizedMessage?: string })?.normalizedMessage ?? 'Failed to create post';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
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
        <h1 className="font-heading font-bold text-xl text-brand-text mb-5">New Blog Post</h1>
        <BlogPostForm onSubmit={handleSubmit} submitLabel="Save Draft" />
      </div>
    </div>
  );
}

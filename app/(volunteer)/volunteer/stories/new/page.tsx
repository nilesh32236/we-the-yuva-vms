'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FileUpload } from '../../../../../components/shared/FileUpload';
import { Button } from '../../../../../components/ui/Button';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';
import { haptic } from '@/lib/haptic';

export default function NewStoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    haptic.medium();
    setSubmitting(true);
    try {
      await api.post('/stories', {
        title: title.trim(),
        content: content.trim(),
        mediaUrl: mediaUrl || undefined,
      });
      toast({ title: 'Story submitted!', description: 'It will be published after review.' });
      router.push('/volunteer/stories');
    } catch {
      toast({ title: 'Error', description: 'Could not submit story.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/volunteer/stories"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <form
        onSubmit={handleSubmit}
        className="bg-brand-surface rounded-2xl border border-brand-border p-6 space-y-5"
      >
        <h1 className="font-heading font-bold text-xl text-brand-text">Share Your Story</h1>
        <p className="text-sm text-brand-muted">
          Tell the community about your volunteering experience
        </p>

        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium text-brand-text">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Teaching 200 Children to Read"
            className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="content" className="text-sm font-medium text-brand-text">
            Your story
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            placeholder="Describe your experience, what you learned, and the impact you made..."
            className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
          />
        </div>

        <FileUpload
          onUpload={setMediaUrl}
          previewUrl={mediaUrl}
          label="Photo/Video (optional)"
          accept="image/*,video/*"
        />

        <Button type="submit" variant="primary" fullWidth loading={submitting}>
          Submit for Review
        </Button>
      </form>
    </div>
  );
}

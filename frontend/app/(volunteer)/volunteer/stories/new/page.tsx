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
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { title?: string; content?: string } = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!content.trim()) errs.content = 'Story content is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
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
    } catch (err) {
      const message =
        (err as { normalizedMessage?: string; response?: { data?: { error?: string } } })
          ?.normalizedMessage ??
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not submit story.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
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
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
            required
            placeholder="e.g. Teaching 200 Children to Read"
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 transition-colors ${errors.title ? 'border-brand-error focus:ring-brand-error/30 bg-brand-error/5' : 'border-brand-border focus:ring-brand-primary'}`}
          />
          {errors.title && <p role="alert" className="text-xs text-brand-error">{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="content" className="text-sm font-medium text-brand-text">
            Your story
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => { setContent(e.target.value); setErrors((p) => ({ ...p, content: undefined })); }}
            required
            rows={8}
            placeholder="Describe your experience, what you learned, and the impact you made..."
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 transition-colors resize-none ${errors.content ? 'border-brand-error focus:ring-brand-error/30 bg-brand-error/5' : 'border-brand-border focus:ring-brand-primary'}`}
          />
          {errors.content && <p role="alert" className="text-xs text-brand-error">{errors.content}</p>}
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

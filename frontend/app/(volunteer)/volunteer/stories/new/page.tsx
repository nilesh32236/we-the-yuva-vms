'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/shared/FileUpload';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type ApiError = { normalizedMessage?: string; response?: { data?: { error?: string } } };

const storySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Story content is required'),
  mediaUrl: z.string().optional(),
});

export default function NewStoryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(storySchema),
    defaultValues: { title: '', content: '', mediaUrl: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    haptic.medium();
    try {
      await api.post('/stories', {
        title: data.title.trim(),
        content: data.content.trim(),
        mediaUrl: data.mediaUrl || undefined,
      });
      toast({ title: 'Story submitted!', description: 'It will be published after review.' });
      router.push('/volunteer/stories');
    } catch (err) {
      const message =
        (err as ApiError)?.normalizedMessage ??
        (err as ApiError)?.response?.data?.error ??
        'Could not submit story.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  });

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/volunteer/stories"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <form
        onSubmit={onSubmit}
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
            {...register('title')}
            placeholder="e.g. Teaching 200 Children to Read"
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 transition-colors ${errors.title ? 'border-brand-error focus:ring-brand-error/30 bg-brand-error/5' : 'border-brand-border focus:ring-brand-primary'}`}
          />
          {errors.title && (
            <p role="alert" className="text-xs text-brand-error">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="content" className="text-sm font-medium text-brand-text">
            Your story
          </label>
          <textarea
            id="content"
            {...register('content')}
            rows={8}
            placeholder="Describe your experience, what you learned, and the impact you made..."
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 transition-colors resize-none ${errors.content ? 'border-brand-error focus:ring-brand-error/30 bg-brand-error/5' : 'border-brand-border focus:ring-brand-primary'}`}
          />
          {errors.content && (
            <p role="alert" className="text-xs text-brand-error">
              {errors.content.message}
            </p>
          )}
        </div>

        <Controller
          name="mediaUrl"
          control={control}
          render={({ field }) => (
            <FileUpload
              onUpload={field.onChange}
              previewUrl={field.value}
              label="Photo/Video (optional)"
              accept="image/*,video/*"
            />
          )}
        />

        <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
          Submit for Review
        </Button>
      </form>
    </div>
  );
}

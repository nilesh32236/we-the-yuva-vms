'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';

const feedbackSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comments: z.string().optional(),
  learnings: z.string().optional(),
  confidence: z.number().min(0).max(5),
});

export default function EventFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      comments: '',
      learnings: '',
      confidence: 0,
    },
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const rating = watch('rating');
  const confidence = watch('confidence');

  const { data: event } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const handleFormSubmit = async (data: z.infer<typeof feedbackSchema>) => {
    haptic.medium();
    setSubmitting(true);
    try {
      await api.post(`/feedback/events/${id}`, {
        rating: data.rating,
        comments: data.comments?.trim() || undefined,
        learnings: data.learnings?.trim() || undefined,
        confidenceLevel: data.confidence || undefined,
      });
      toast({
        title: 'Feedback submitted!',
        description: 'Thank you for sharing your experience.',
      });
      router.push('/volunteer/events');
    } catch (err) {
      const message =
        (err as { normalizedMessage?: string; response?: { data?: { error?: string } } })
          ?.normalizedMessage ??
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not submit feedback.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/volunteer/events"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer py-2 min-h-11"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <h1 className="font-heading font-bold text-xl text-brand-text mb-1">Share Your Feedback</h1>
        <p className="text-sm text-brand-muted mb-6">
          {event?.title ? `How was "${event.title}"?` : 'How was this event?'}
        </p>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <label
              htmlFor="rating"
              id="rating-label"
              className="text-sm font-medium text-brand-text"
            >
              Rating
            </label>
            <div
              className="flex items-center gap-1"
              role="radiogroup"
              aria-labelledby="rating-label"
            >
              <input type="hidden" id="rating" value={rating} readOnly />
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                  onClick={() => setValue('rating', n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1.5 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-lg"
                >
                  <Star
                    className={`w-8 h-8 ${n <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-brand-border'}`}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p id="rating-error" className="text-xs text-destructive mt-1" role="alert">
                {errors.rating.message}
              </p>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-1.5">
            <label htmlFor="comments" className="text-sm font-medium text-brand-text">
              Comments (optional)
            </label>
            <textarea
              id="comments"
              {...register('comments')}
              rows={3}
              disabled={submitting}
              aria-invalid={!!errors.comments}
              placeholder="What did you enjoy? Any suggestions for improvement?"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 resize-none ${
                errors.comments
                  ? 'border-brand-error focus:ring-brand-error/30'
                  : 'border-brand-border focus:ring-brand-primary'
              }`}
            />
            {errors.comments && (
              <p role="alert" className="text-xs text-brand-error">
                {errors.comments.message}
              </p>
            )}
          </div>

          {/* Learnings / Reflection */}
          <div className="space-y-1.5">
            <label htmlFor="learnings" className="text-sm font-medium text-brand-text">
              What did you learn? (optional)
            </label>
            <textarea
              id="learnings"
              {...register('learnings')}
              rows={3}
              disabled={submitting}
              aria-invalid={!!errors.learnings}
              placeholder="Share something new you learned or experienced..."
              className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 resize-none ${
                errors.learnings
                  ? 'border-brand-error focus:ring-brand-error/30'
                  : 'border-brand-border focus:ring-brand-primary'
              }`}
            />
            {errors.learnings && (
              <p role="alert" className="text-xs text-brand-error">
                {errors.learnings.message}
              </p>
            )}
          </div>

          {/* Confidence level */}
          <div className="space-y-2">
            <label htmlFor="confidence" className="text-sm font-medium text-brand-text">
              Confidence level after this event (optional)
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setValue('confidence', n === confidence ? 0 : n)}
                  disabled={submitting}
                  aria-invalid={!!errors.confidence}
                  className={`w-11 h-11 rounded-xl text-sm font-semibold border transition-colors cursor-pointer
                    ${n <= confidence ? 'bg-brand-primary text-white border-brand-primary' : 'bg-brand-surface text-brand-muted border-brand-border hover:border-brand-primary'}`}
                >
                  {n}
                </button>
              ))}
            </div>
            {errors.confidence && (
              <p role="alert" className="text-xs text-brand-error">
                {errors.confidence.message}
              </p>
            )}
            <p className="text-xs text-brand-muted">1 = Low confidence · 5 = Very confident</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={submitting}
            disabled={submitting}
          >
            Submit Feedback
          </Button>
        </form>
      </div>
    </div>
  );
}

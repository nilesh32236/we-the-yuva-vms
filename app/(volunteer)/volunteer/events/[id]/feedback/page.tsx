'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { haptic } from '@/lib/haptic';
import { Button } from '../../../../../../components/ui/Button';
import { useToast } from '../../../../../../hooks/use-toast';
import { api } from '../../../../../../lib/api';

export default function EventFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [ratingTouched, setRatingTouched] = useState(false);
  const [comments, setComments] = useState('');
  const [learnings, setLearnings] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { data: event } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    haptic.medium();
    setSubmitting(true);
    try {
      await api.post(`/feedback/events/${id}`, {
        rating,
        comments: comments.trim() || undefined,
        learnings: learnings.trim() || undefined,
        confidenceLevel: confidence || undefined,
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
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <h1 className="font-heading font-bold text-xl text-brand-text mb-1">Share Your Feedback</h1>
        <p className="text-sm text-brand-muted mb-6">
          {event?.title ? `How was "${event.title}"?` : 'How was this event?'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <label htmlFor="rating" className="text-sm font-medium text-brand-text">
              Rating
            </label>
            <div className="flex items-center gap-1">
              <input type="hidden" id="rating" value={rating} readOnly />
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setRating(n);
                    setRatingTouched(true);
                  }}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1 cursor-pointer transition-colors"
                >
                  <Star
                    className={`w-7 h-7 ${n <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-brand-border'}`}
                  />
                </button>
              ))}
            </div>
            {ratingTouched && rating === 0 && (
              <p id="rating-error" className="text-xs text-destructive mt-1" role="alert">
                Please select a rating.
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
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="What did you enjoy? Any suggestions for improvement?"
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
            />
          </div>

          {/* Learnings / Reflection */}
          <div className="space-y-1.5">
            <label htmlFor="learnings" className="text-sm font-medium text-brand-text">
              What did you learn? (optional)
            </label>
            <textarea
              id="learnings"
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              rows={3}
              placeholder="Share something new you learned or experienced..."
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
            />
          </div>

          {/* Confidence level */}
          <div className="space-y-2">
            <label htmlFor="confidence" className="text-sm font-medium text-brand-text">
              Confidence level after this event (optional)
            </label>
            <div className="flex items-center gap-3">
              <input type="hidden" id="confidence" value={confidence} readOnly />
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setConfidence(n === confidence ? 0 : n)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-colors cursor-pointer
                    ${n <= confidence ? 'bg-brand-primary text-white border-brand-primary' : 'bg-brand-surface text-brand-muted border-brand-border hover:border-brand-primary'}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-brand-muted">1 = Low confidence · 5 = Very confident</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={submitting}
            disabled={rating === 0}
          >
            Submit Feedback
          </Button>
        </form>
      </div>
    </div>
  );
}

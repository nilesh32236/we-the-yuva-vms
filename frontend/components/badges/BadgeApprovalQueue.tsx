'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  FileText,
  Loader2,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { SkeletonCard } from '../shared/SkeletonCard';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

interface PendingApproval {
  id: string;
  user: { id: string; name: string; email: string };
  badge: { id: string; name: string; title: string; description: string; imageUrl: string };
  status: string;
  requestedAt: string;
}

function ReviewModal({
  request,
  onClose,
}: {
  request: PendingApproval;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [reviewNote, setReviewNote] = useState('');
  const dialogRef = useFocusTrap(true);

  const reviewMutation = useMutation({
    mutationFn: ({ action }: { action: 'approve' | 'reject' }) =>
      api.post(`/badges/${request.user.id}/${request.badge.id}/${action}`, {
        reviewNote: reviewNote || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-badge-pending'] });
      toast({
        title: `Request ${reviewMutation.variables?.action === 'approve' ? 'approved' : 'rejected'}`,
      });
      onClose();
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast({
        title: 'Failed',
        description: err?.response?.data?.error ?? 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="bg-brand-surface rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 id="review-title" className="font-heading font-bold text-lg text-brand-text">
            Review Badge
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-brand-bg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 text-brand-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-brand-muted">Volunteer</p>
            <p className="font-medium text-brand-text">{request.user.name}</p>
            <p className="text-sm text-brand-muted">{request.user.email}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-brand-muted">{request.badge.title}</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-brand-muted">Badge Description</p>
            <p className="text-sm text-brand-text bg-brand-bg rounded-xl px-3 py-2.5">
              {request.badge.description}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="review-note" className="block text-xs font-medium text-brand-muted">
              Review Note
            </label>
            <textarea
              id="review-note"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              placeholder="Add a note for the volunteer..."
              className="w-full text-sm border border-brand-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={() => reviewMutation.mutate({ action: 'reject' })}
            disabled={reviewMutation.isPending}
            className="flex-1 py-2.5 rounded-xl border border-brand-error text-brand-error text-sm font-semibold hover:bg-brand-error/5 cursor-pointer transition-colors disabled:opacity-60"
          >
            {reviewMutation.isPending && reviewMutation.variables?.action === 'reject' ? (
              <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
            ) : (
              <XCircle className="w-4 h-4 inline mr-1" />
            )}
            Reject
          </button>
          <button
            type="button"
            onClick={() => reviewMutation.mutate({ action: 'approve' })}
            disabled={reviewMutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary cursor-pointer transition-colors disabled:opacity-60"
          >
            {reviewMutation.isPending && reviewMutation.variables?.action === 'approve' ? (
              <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
            ) : (
              <CheckCircle className="w-4 h-4 inline mr-1" />
            )}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

export function BadgeApprovalQueue() {
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PendingApproval | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-badge-pending', search],
    queryFn: () =>
      api
        .get('/badges/pending', {
          params: { search: search || undefined },
        })
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const requests: PendingApproval[] = data?.data ?? [];

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by volunteer name or email…"
          aria-label="Search badge approvals"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-brand-muted text-sm bg-brand-surface rounded-2xl border border-brand-border">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No pending approvals</p>
          <p className="text-sm mt-1">All badge requests have been reviewed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-brand-surface card-hover rounded-2xl border border-brand-border p-5 space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-brand-text">{req.user.name}</p>
                  <p className="text-sm text-brand-muted">{req.user.email}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  {req.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-brand-text">{req.badge.title}</span>
              </div>

              <p className="text-sm text-brand-muted bg-brand-bg rounded-xl px-3 py-2.5 italic">
                &ldquo;{req.badge.description}&rdquo;
              </p>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-brand-border">
                <p className="text-xs text-brand-muted">
                  {new Date(req.requestedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                {req.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(req)}
                    className="text-sm font-semibold text-brand-primary hover:underline cursor-pointer"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRequest && (
        <ReviewModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}
    </div>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle, Download, FileText, Loader2, Search, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../hooks/use-toast';
import { api } from '../../../../lib/api';

interface LevelRequest {
  id: string;
  volunteer: { id: string; name: string; email: string };
  currentLevel: string;
  requestedLevel: string;
  notes?: string;
  proofUrls?: string[];
  status: string;
  createdAt: string;
}

function ReviewModal({ request, onClose }: { request: LevelRequest; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [reviewNote, setReviewNote] = useState('');

  const reviewMutation = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      api.patch(`/levels/admin/level-requests/${request.id}`, {
        status,
        reviewNote: reviewNote || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-level-requests'] });
      toast({
        title: `Request ${reviewMutation.variables?.status === 'APPROVED' ? 'approved' : 'rejected'}`,
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
            Review Request
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
            <p className="font-medium text-brand-text">{request.volunteer.name}</p>
            <p className="text-sm text-brand-muted">{request.volunteer.email}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-brand-muted">{request.currentLevel}</span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-muted" />
            <span className="text-sm font-semibold text-brand-text">{request.requestedLevel}</span>
          </div>

          {request.notes && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-brand-muted">Notes from Volunteer</p>
              <p className="text-sm text-brand-text bg-brand-bg rounded-xl px-3 py-2.5">
                {request.notes}
              </p>
            </div>
          )}

          {request.proofUrls && request.proofUrls.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-brand-muted">Proof Files</p>
              <div className="space-y-1.5">
                {request.proofUrls.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-brand-primary hover:underline cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Proof {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

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
            onClick={() => reviewMutation.mutate({ status: 'REJECTED' })}
            disabled={reviewMutation.isPending}
            className="flex-1 py-2.5 rounded-xl border border-brand-error text-brand-error text-sm font-semibold hover:bg-brand-error/5 cursor-pointer transition-colors disabled:opacity-60"
          >
            {reviewMutation.isPending && reviewMutation.variables?.status === 'REJECTED' ? (
              <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
            ) : (
              <XCircle className="w-4 h-4 inline mr-1" />
            )}
            Reject
          </button>
          <button
            type="button"
            onClick={() => reviewMutation.mutate({ status: 'APPROVED' })}
            disabled={reviewMutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary cursor-pointer transition-colors disabled:opacity-60"
          >
            {reviewMutation.isPending && reviewMutation.variables?.status === 'APPROVED' ? (
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

export default function AdminLevelRequestsPage() {
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LevelRequest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-level-requests', search],
    queryFn: () =>
      api
        .get('/levels/admin/level-requests', {
          params: { search: search || undefined },
        })
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const requests: LevelRequest[] = data?.data ?? [];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-xl text-brand-text">Level-Up Requests</h1>
          <p className="text-brand-muted text-sm mt-0.5">
            Review and approve volunteer level-up requests.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by volunteer name or email…"
          aria-label="Search level-up requests"
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
          <p className="font-medium">No pending requests</p>
          <p className="text-sm mt-1">All level-up requests have been reviewed.</p>
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
                  <p className="font-heading font-semibold text-brand-text">{req.volunteer.name}</p>
                  <p className="text-sm text-brand-muted">{req.volunteer.email}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    req.status === 'PENDING'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : req.status === 'APPROVED'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-brand-error'
                  }`}
                >
                  {req.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-brand-muted">{req.currentLevel}</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-muted" />
                <span className="font-semibold text-brand-text">{req.requestedLevel}</span>
              </div>

              {req.notes && (
                <p className="text-sm text-brand-muted bg-brand-bg rounded-xl px-3 py-2.5 italic">
                  &ldquo;{req.notes}&rdquo;
                </p>
              )}

              {req.proofUrls && req.proofUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {req.proofUrls.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Proof {i + 1}
                    </a>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-brand-border">
                <p className="text-xs text-brand-muted">
                  {new Date(req.createdAt).toLocaleDateString('en-IN', {
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

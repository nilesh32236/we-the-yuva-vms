'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell } from 'lucide-react';
import Link from 'next/link';
import { SkeletonCard } from '../../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';

const TYPE_LABELS: Record<string, string> = {
  application_accepted: 'Application accepted',
  application_rejected: 'Application rejected',
  event_invitation: 'Event invitation',
  event_reminder: 'Event reminder',
  account_suspended: 'Account suspended',
  promotion: 'Promotions & updates',
};

export default function NotificationPrefsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => api.get('/notifications/preferences').then((r) => r.data),
    staleTime: 30_000,
  });

  const updateMut = useMutation({
    mutationFn: ({ type, email, push }: { type: string; email?: boolean; push?: boolean }) =>
      api.put(`/notifications/preferences/${type}`, { email, push }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-prefs'] });
      toast({ title: 'Preference updated' });
    },
    onError: (err: unknown) =>
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      }),
  });

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/volunteer/profile"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-white rounded-2xl border border-brand-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-brand-primary" />
          <h1 className="font-heading font-bold text-xl text-brand-text">
            Notification Preferences
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !prefs?.length ? (
          <p className="text-center py-12 text-brand-muted text-sm">
            No notification preferences found
          </p>
        ) : (
          <div className="space-y-4">
            {prefs.map((p: { type: string; email: boolean; push: boolean }) => (
              <div key={p.type} className="border border-brand-border rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-brand-text">
                  {TYPE_LABELS[p.type] ?? p.type}
                </p>
                <div className="flex items-center gap-6">
                  <label
                    htmlFor={`notif-${p.type}-email`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      id={`notif-${p.type}-email`}
                      type="checkbox"
                      checked={p.email}
                      onChange={() => updateMut.mutate({ type: p.type, email: !p.email })}
                      className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary cursor-pointer"
                    />
                    <span className="text-sm text-brand-muted">Email</span>
                  </label>
                  <label
                    htmlFor={`notif-${p.type}-push`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      id={`notif-${p.type}-push`}
                      type="checkbox"
                      checked={p.push}
                      onChange={() => updateMut.mutate({ type: p.type, push: !p.push })}
                      className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary cursor-pointer"
                    />
                    <span className="text-sm text-brand-muted">Push</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

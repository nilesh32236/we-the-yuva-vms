// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Mail, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { SkeletonCard } from '../../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';
import { haptic } from '@/lib/haptic';

const TYPE_LABELS: Record<string, string> = {
  APPLICATION_ACCEPTED: 'Application Updates',
  EVENT_REMINDER: 'Event Reminders',
  PROMOTION: 'Promotions & Updates',
  WEEKLY_DIGEST: 'Weekly Digest',
  SYSTEM_ANNOUNCEMENT: 'System Announcements',
  NEW_APPLICATION: 'New Applications',
  MENTORSHIP: 'Mentorship Updates',
  TRAINING: 'Training Updates',
  LEVEL_UP: 'Level Up',
  BADGE_EARNED: 'Badges Earned',
  CERTIFICATE_ISSUED: 'Certificate Issued',
  ATTENDANCE_CONFIRMED: 'Attendance Confirmed',
  FEEDBACK_REMINDER: 'Feedback Reminders',
  STORY_PUBLISHED: 'Story Published',
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  APPLICATION_ACCEPTED: 'When your application to an opportunity is approved or declined',
  EVENT_REMINDER: 'Invitations and reminders for upcoming events',
  PROMOTION: 'New opportunities and featured announcements',
  WEEKLY_DIGEST: 'A weekly summary of your volunteer activities',
  SYSTEM_ANNOUNCEMENT: 'Important updates about your account and platform changes',
  NEW_APPLICATION: 'When a new volunteer applies to your opportunity',
  MENTORSHIP: 'Updates and reminders about mentorship sessions',
  TRAINING: 'Training session schedules and related materials',
  LEVEL_UP: 'When you reach a new volunteer level',
  BADGE_EARNED: 'When you earn a new badge',
  CERTIFICATE_ISSUED: 'When a certificate is issued for a completed activity',
  ATTENDANCE_CONFIRMED: 'When your attendance at an event is confirmed',
  FEEDBACK_REMINDER: 'Reminders to provide feedback on activities and events',
  STORY_PUBLISHED: 'When a story or article is published',
};

function ToggleSwitch({
  checked,
  onChange,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  id: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      aria-disabled={disabled}
      className={`w-11 h-7 rounded-full transition-colors duration-200 relative flex-shrink-0 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-brand-primary' : 'bg-brand-border'}`}
    >
      <div
        className={`absolute top-1 left-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

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

      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-brand-text">
                Notification Preferences
              </h1>
              <p className="text-xs text-brand-muted mt-0.5">
                Choose how you receive notifications for each type
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div role="status" aria-busy="true" className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : !prefs?.length ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-brand-muted" />
              </div>
              <p className="font-medium text-brand-text">No notification preferences found</p>
              <p className="text-sm text-brand-muted mt-1">
                Preferences will appear once you receive your first notification
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {prefs.map((p: { type: string; email: boolean; push: boolean }) => (
                <div key={p.type} className="rounded-xl border border-brand-border overflow-hidden">
                  <div className="px-4 py-3.5 bg-brand-bg/50 border-b border-brand-border">
                    <p className="text-sm font-semibold text-brand-text">
                      {TYPE_LABELS[p.type] ?? p.type}
                    </p>
                    {TYPE_DESCRIPTIONS[p.type] && (
                      <p className="text-xs text-brand-muted mt-0.5">{TYPE_DESCRIPTIONS[p.type]}</p>
                    )}
                  </div>
                  <div className="px-4 py-3 flex items-center gap-6">
                    <label
                      htmlFor={`notif-${p.type}-email`}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-bg flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5 text-brand-muted" />
                      </div>
                      <span className="text-sm text-brand-text flex-1">Email</span>
                      <ToggleSwitch
                        id={`notif-${p.type}-email`}
                        checked={p.email}
                        disabled={updateMut.isPending}
                        onChange={() => {
                          haptic.light();
                          updateMut.mutate({ type: p.type, email: !p.email });
                        }}
                      />
                    </label>
                    <div className="w-px h-6 bg-brand-border" />
                    <label
                      htmlFor={`notif-${p.type}-push`}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-bg flex items-center justify-center">
                        <Smartphone className="w-3.5 h-3.5 text-brand-muted" />
                      </div>
                      <span className="text-sm text-brand-text flex-1">Push</span>
                      <ToggleSwitch
                        id={`notif-${p.type}-push`}
                        checked={p.push}
                        disabled={updateMut.isPending}
                        onChange={() => {
                          haptic.light();
                          updateMut.mutate({ type: p.type, push: !p.push });
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

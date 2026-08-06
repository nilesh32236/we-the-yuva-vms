'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/Button';

const DISMISS_KEY = 'profile-banner-dismissed';

function isDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (!stored) return false;
    const timestamp = Number.parseInt(stored, 10);
    if (Number.isNaN(timestamp)) return false;
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    return Date.now() - timestamp < THREE_DAYS;
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
}

const fieldLabels: Record<string, string> = {
  skills: 'Skills',
  interests: 'Interests',
  volunteerType: 'Volunteer Type',
  availability: 'Availability',
};

export function ProfileCompletionBanner() {
  const { user, profileStatus, profileStatusError, refetch } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (profileStatus && !profileStatus.isComplete && !isDismissed()) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [profileStatus]);

  const handleDismiss = useCallback(() => {
    dismiss();
    setVisible(false);
  }, []);

  if (profileStatusError) {
    return (
      <div className="rounded-2xl border border-brand-error/30 bg-brand-error/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="font-heading font-semibold text-sm text-brand-error">
              {profileStatusError}
            </p>
            <p className="text-xs text-brand-muted">Your profile completion couldn&apos;t be loaded.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!visible || !profileStatus || !user) return null;

  const { completionPercentage, missingFields } = profileStatus;
  const isVolunteer = user.role === 'VOLUNTEER';
  const bannerTitle = isVolunteer
    ? 'Complete your profile to unlock all features'
    : 'Complete setup to get started';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-accent/10 border border-brand-accent/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 min-w-0 flex-1">
          <div>
            <p className="font-heading font-semibold text-sm text-brand-accent">
              {bannerTitle}
            </p>
            <p className="text-xs text-brand-accent mt-0.5">
              {completionPercentage}% complete
              {missingFields.length > 0 &&
                ` — Missing: ${missingFields.map((f) => fieldLabels[f] ?? f).join(', ')}`}
            </p>
          </div>

          <div className="w-full h-2 rounded-full bg-brand-accent/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-accent origin-left motion-safe:transition-transform motion-safe:duration-500"
              style={{ transform: `scaleX(${completionPercentage / 100})` }}
            />
          </div>

          <Link href="/setup-profile">
            <Button variant="primary" size="sm">
              {isVolunteer ? 'Complete Now' : 'Complete Setup'}
            </Button>
          </Link>
        </div>

        <Button
          onClick={handleDismiss}
          variant="icon"
          size="icon"
          className="flex-shrink-0 hover:bg-brand-accent/10"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-brand-accent" />
        </Button>
      </div>
    </div>
  );
}

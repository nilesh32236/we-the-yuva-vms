'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
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
  const { profileStatus } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (profileStatus && !profileStatus.isComplete && !isDismissed()) {
      setVisible(true);
    }
  }, [profileStatus]);

  const handleDismiss = useCallback(() => {
    dismiss();
    setVisible(false);
  }, []);

  if (!visible || !profileStatus) return null;

  const { completionPercentage, missingFields } = profileStatus;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-amber-50 border border-amber-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 min-w-0 flex-1">
          <div>
            <p className="font-heading font-semibold text-sm text-amber-800">
              Complete your profile to unlock all features
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {completionPercentage}% complete
              {missingFields.length > 0 &&
                ` — Missing: ${missingFields.map((f) => fieldLabels[f] ?? f).join(', ')}`}
            </p>
          </div>

          <div className="w-full h-2 rounded-full bg-amber-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <Link href="/setup-profile">
            <Button variant="primary" size="sm">
              Complete Now
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-amber-500" />
        </button>
      </div>
    </div>
  );
}

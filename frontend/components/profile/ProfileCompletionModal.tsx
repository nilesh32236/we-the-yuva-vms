'use client';

import Link from 'next/link';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ProfileCompletionModalProps {
  open: boolean;
  completionPercentage: number;
  missingFields: string[];
  onClose: () => void;
}

const fieldLabels: Record<string, string> = {
  skills: 'Skills',
  interests: 'interests',
  volunteerType: 'Volunteer Type',
  availability: 'Availability',
};

export function ProfileCompletionModal({
  open,
  completionPercentage,
  missingFields,
  onClose,
}: ProfileCompletionModalProps) {
  const dialogRef = useFocusTrap(open);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-completion-title"
      aria-describedby="profile-completion-desc"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="bg-brand-surface rounded-2xl shadow-xl w-full max-w-sm">
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1">
            <h2
              id="profile-completion-title"
              className="font-heading font-bold text-lg text-brand-text"
            >
              Complete Your Profile
            </h2>
            <p id="profile-completion-desc" className="text-sm text-brand-muted">
              You need to complete your profile before applying to opportunities.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-muted">Profile completeness</span>
              <span className="font-semibold text-brand-text">{completionPercentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-brand-border overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-primary transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {missingFields.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">
                Missing fields
              </p>
              <ul className="space-y-1">
                {missingFields.map((field) => (
                  <li key={field} className="flex items-center gap-2 text-sm text-brand-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    {fieldLabels[field] ?? field}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-brand-border text-sm font-medium text-brand-muted hover:bg-brand-bg bg-background cursor-pointer transition-colors"
          >
            Maybe Later
          </button>
          <Link
            href="/setup-profile"
            className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold text-center hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            Complete Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

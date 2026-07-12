'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, CheckCircle, Clock, LogIn, LogOut, Star } from 'lucide-react';
import { haptic } from '../../lib/haptic';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/use-toast';
import * as Sentry from '@sentry/nextjs';

interface Volunteer {
  volunteerId: string;
  name: string;
  email: string;
  attended: boolean;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  approvedHours: number | null;
  rating: number | null;
  approvedAt: string | null;
}

interface AttendanceChecklistProps {
  volunteers: Volunteer[];
  onSave: (attendances: { volunteerId: string; attended: boolean }[]) => Promise<void>;
  onApprove: (volunteerId: string, approvedHours: number, rating: number) => Promise<void>;
}

function calcDuration(checkedInAt: string, checkedOutAt: string): number {
  return (new Date(checkedOutAt).getTime() - new Date(checkedInAt).getTime()) / 3_600_000;
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function AttendanceChecklist({ volunteers, onSave, onApprove }: AttendanceChecklistProps) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(volunteers.map((v) => [v.volunteerId, v.attended]))
  );
  const [hoursInputs, setHoursInputs] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    setState((prev) => {
      const next = { ...prev };
      const newIds = new Set(Object.keys(prev));
      for (const v of volunteers) {
        if (!newIds.has(v.volunteerId)) {
          next[v.volunteerId] = v.attended;
        }
      }
      return next;
    });
    setHoursInputs((prev) => {
      const next = { ...prev };
      for (const v of volunteers) {
        if (v.checkedInAt && v.checkedOutAt && !v.approvedAt) {
          const duration = calcDuration(v.checkedInAt, v.checkedOutAt);
          const rounded = Math.round(duration * 2) / 2;
          if (!(v.volunteerId in prev)) {
            next[v.volunteerId] = rounded.toFixed(1);
          }
        }
      }
      return next;
    });
    setRatings((prev) => {
      const next = { ...prev };
      for (const v of volunteers) {
        if (v.rating != null && !(v.volunteerId in prev)) {
          next[v.volunteerId] = v.rating;
        }
      }
      return next;
    });
  }, [volunteers]);

  const attended = Object.values(state).filter(Boolean).length;
  const checkedIn = volunteers.filter((v) => v.checkedInAt).length;
  const checkedOut = volunteers.filter((v) => v.checkedOutAt).length;
  const approved = volunteers.filter((v) => v.approvedAt).length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(
        Object.entries(state).map(([volunteerId, attended]) => ({ volunteerId, attended }))
      );
    } catch (err) {
      Sentry.captureException(err);
      toast({
        title: 'Error',
        description: (err as { normalizedMessage?: string })?.normalizedMessage ?? 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (v: Volunteer) => {
    const hours = parseFloat(hoursInputs[v.volunteerId] || '0');
    const rating = ratings[v.volunteerId] || 0;
    if (hours <= 0) {
      toast({ title: 'Validation error', description: 'Hours must be greater than 0', variant: 'destructive' });
      return;
    }
    if (rating < 1 || rating > 5) {
      toast({ title: 'Validation error', description: 'Rating must be between 1 and 5', variant: 'destructive' });
      return;
    }
    setApproving((s) => ({ ...s, [v.volunteerId]: true }));
    try {
      haptic.medium();
      await onApprove(v.volunteerId, hours, rating);
    } catch (err) {
      Sentry.captureException(err);
      toast({
        title: 'Error',
        description: (err as { normalizedMessage?: string })?.normalizedMessage ?? 'Failed to approve volunteer',
        variant: 'destructive',
      });
    } finally {
      setApproving((s) => ({ ...s, [v.volunteerId]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs text-brand-muted">
        <span className="flex items-center gap-1">
          <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          {checkedIn} checked in
        </span>
        <span className="flex items-center gap-1">
          <LogOut className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
          {checkedOut} checked out
        </span>
        <span className="flex items-center gap-1">
          <BadgeCheck className="w-3.5 h-3.5 text-brand-primary" />
          {approved} approved
        </span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-text">
          {attended} / {volunteers.length} attended
        </p>
        <button
          type="button"
          onClick={() => {
            haptic.light();
            setState(Object.fromEntries(volunteers.map((v) => [v.volunteerId, true])));
          }}
          className="text-xs text-brand-primary hover:underline cursor-pointer"
        >
          Mark all
        </button>
      </div>

      <div className="space-y-2">
        {volunteers.map((v) => {
          const duration =
            v.checkedInAt && v.checkedOutAt ? calcDuration(v.checkedInAt, v.checkedOutAt) : null;
          const isApproved = !!v.approvedAt;

          return (
            <div
              key={v.volunteerId}
              className="p-3 rounded-xl border border-brand-border hover:bg-brand-bg transition-colors"
            >
              {/* Row 1: checkbox + name/email + times + status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`attendance-${v.volunteerId}`}
                  checked={state[v.volunteerId]}
                  onChange={() => {
                    haptic.light();
                    setState((s) => ({ ...s, [v.volunteerId]: !s[v.volunteerId] }));
                  }}
                  className="w-5 h-5 rounded accent-brand-primary cursor-pointer"
                />
                <label
                  htmlFor={`attendance-${v.volunteerId}`}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <p className="text-sm font-medium text-brand-text truncate">{v.name}</p>
                  <p className="text-xs text-brand-muted truncate">{v.email}</p>
                </label>

                {/* Check-in/out times */}
                <div className="flex flex-col items-end gap-0.5 text-xs text-brand-muted flex-shrink-0">
                  {v.checkedInAt && (
                    <span className="flex items-center gap-1">
                      <LogIn className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {new Date(v.checkedInAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  {v.checkedOutAt && (
                    <span className="flex items-center gap-1">
                      <LogOut className="w-3 h-3 text-red-500 dark:text-red-400" />
                      {new Date(v.checkedOutAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                {/* Duration badge */}
                {duration != null && (
                  <div className="flex items-center gap-1 text-sm font-semibold text-brand-primary flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(duration)}
                  </div>
                )}

                {/* Not checked out badge */}
                {v.checkedInAt && !v.checkedOutAt && (
                  <span className="text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full flex-shrink-0">
                    Active
                  </span>
                )}

                {/* Approved badge */}
                {isApproved && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full flex-shrink-0">
                    <CheckCircle className="w-3 h-3" />
                    {v.approvedHours}h · {v.rating}★
                  </span>
                )}
              </div>

              {/* Row 2: Hours + Rating + Approve (only for checked out, not yet approved) */}
              {v.checkedInAt && v.checkedOutAt && !isApproved && (
                <div className="mt-3 flex items-end gap-3 pl-8">
                  {/* Hours input */}
                  <div className="flex-1">
                    <label
                      htmlFor={`hours-input-${v.volunteerId}`}
                      className="text-xs text-brand-muted block mb-1"
                    >
                      Hours
                    </label>
                    <input
                      id={`hours-input-${v.volunteerId}`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={hoursInputs[v.volunteerId] ?? ''}
                      onChange={(e) =>
                        setHoursInputs((s) => ({ ...s, [v.volunteerId]: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-brand-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      placeholder="Hours"
                    />
                  </div>

                  {/* Rating stars */}
                  <div>
                    <label
                      htmlFor={`rating-${v.volunteerId}`}
                      className="text-xs text-brand-muted block mb-1"
                    >
                      Rating
                    </label>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            haptic.light();
                            setRatings((s) => ({ ...s, [v.volunteerId]: star }));
                          }}
                          className="cursor-pointer p-0.5"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              (ratings[v.volunteerId] ?? 0) >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-brand-border'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Approve button */}
                  <Button
                    size="sm"
                    loading={approving[v.volunteerId]}
                    disabled={
                      !hoursInputs[v.volunteerId] ||
                      parseFloat(hoursInputs[v.volunteerId] || '0') <= 0 ||
                      !ratings[v.volunteerId]
                    }
                    onClick={() => handleApprove(v)}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button
        fullWidth
        onClick={() => {
          haptic.medium();
          handleSave();
        }}
        loading={saving}
      >
        Save Attendance
      </Button>
    </div>
  );
}

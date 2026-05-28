'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';

interface Volunteer {
  volunteerId: string;
  name: string;
  email: string;
  attended: boolean;
}

interface AttendanceChecklistProps {
  volunteers: Volunteer[];
  onSave: (attendances: { volunteerId: string; attended: boolean }[]) => Promise<void>;
}

export function AttendanceChecklist({ volunteers, onSave }: AttendanceChecklistProps) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(volunteers.map((v) => [v.volunteerId, v.attended]))
  );
  const [saving, setSaving] = useState(false);

  const attended = Object.values(state).filter(Boolean).length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(
        Object.entries(state).map(([volunteerId, attended]) => ({ volunteerId, attended }))
      );
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-text">
          {attended} / {volunteers.length} attended
        </p>
        <button
          type="button"
          onClick={() => setState(Object.fromEntries(volunteers.map((v) => [v.volunteerId, true])))}
          className="text-xs text-brand-primary hover:underline cursor-pointer"
        >
          Mark all
        </button>
      </div>

      <div className="space-y-2">
        {volunteers.map((v) => (
          <label
            key={v.volunteerId}
            className="flex items-center gap-3 p-3 rounded-xl border border-brand-border hover:bg-brand-bg cursor-pointer transition-colors"
          >
            <div
              role="checkbox"
              aria-checked={state[v.volunteerId]}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setState((s) => ({ ...s, [v.volunteerId]: !s[v.volunteerId] }));
                }
              }}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
              ${state[v.volunteerId] ? 'bg-brand-primary border-brand-primary' : 'border-brand-border'}`}
              onClick={() => setState((s) => ({ ...s, [v.volunteerId]: !s[v.volunteerId] }))}
            >
              {state[v.volunteerId] && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-text truncate">{v.name}</p>
              <p className="text-xs text-brand-muted truncate">{v.email}</p>
            </div>
          </label>
        ))}
      </div>

      <Button variant="primary" fullWidth onClick={handleSave} loading={saving}>
        Save Attendance
      </Button>
    </div>
  );
}

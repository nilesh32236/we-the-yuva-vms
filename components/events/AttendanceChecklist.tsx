'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    setState(Object.fromEntries(volunteers.map((v) => [v.volunteerId, v.attended])));
  }, [volunteers]);

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
          <div
            key={v.volunteerId}
            className="flex items-center gap-3 p-3 rounded-xl border border-brand-border hover:bg-brand-bg cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              id={`attendance-${v.volunteerId}`}
              checked={state[v.volunteerId]}
              onChange={() => setState((s) => ({ ...s, [v.volunteerId]: !s[v.volunteerId] }))}
              className="w-5 h-5 rounded accent-brand-primary cursor-pointer"
            />
            <label
              htmlFor={`attendance-${v.volunteerId}`}
              className="flex-1 min-w-0 cursor-pointer"
            >
              <p className="text-sm font-medium text-brand-text truncate">{v.name}</p>
              <p className="text-xs text-brand-muted truncate">{v.email}</p>
            </label>
          </div>
        ))}
      </div>

      <Button variant="primary" fullWidth onClick={handleSave} loading={saving}>
        Save Attendance
      </Button>
    </div>
  );
}

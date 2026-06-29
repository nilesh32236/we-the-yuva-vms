'use client';

import { CheckCircle, Circle } from 'lucide-react';

interface RequirementChecklistProps {
  requirements: Record<string, unknown>;
  progress: Record<string, number>;
  levelName: string;
}

function getRequirementLabel(key: string): string {
  const labels: Record<string, string> = {
    eventsAttended: 'Attend events',
    hoursVolunteered: 'Volunteer hours',
    endorsements: 'Peer endorsements',
    citizensImpacted: 'Citizens impacted',
    participations: 'Activity participations',
  };
  return labels[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

export function RequirementChecklist({
  requirements,
  progress,
  levelName,
}: RequirementChecklistProps) {
  const entries = Object.entries(requirements).filter(
    ([, value]) => typeof value === 'number',
  ) as [string, number][];

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3" role="list" aria-label={`Requirements for ${levelName}`}>
      <h4 className="text-sm font-semibold text-brand-text">Requirements</h4>
      {entries.map(([key, required]) => {
        const current = progress[key] ?? 0;
        const met = current >= required;
        const pct = Math.min((current / required) * 100, 100);

        return (
          <div key={key} className="flex items-start gap-3" role="listitem">
            <div className="mt-0.5 flex-shrink-0">
              {met ? (
                <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
              ) : (
                <Circle className="w-5 h-5 text-brand-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm ${met ? 'text-brand-text' : 'text-brand-muted'}`}>
                  {getRequirementLabel(key)}
                </span>
                <span className={`text-xs font-medium flex-shrink-0 ${met ? 'text-green-500 dark:text-green-400' : 'text-brand-muted'}`}>
                  {current}/{required}
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-brand-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${met ? 'bg-green-500' : 'bg-brand-primary'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

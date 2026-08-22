'use client';

import { Sprout } from 'lucide-react';

const ACTS = [
  'Help someone without being asked',
  'Listen patiently to someone who needs to talk',
  'Help someone learn a new skill',
  'Appreciate or encourage someone',
  'Help an elderly person with a task',
  'Share useful knowledge, resources, or information',
  'Help someone struggling with technology',
  'Include someone who feels left out',
  'Help keep my neighborhood or public space clean',
  'Support someone in completing an important task',
  'Volunteer my time for a community activity',
];

export interface KindnessOptIn {
  optedIn: boolean;
  acts: string[];
  startDate: string; // yyyy-mm-dd
}

interface Props {
  value: KindnessOptIn;
  onChange: (v: KindnessOptIn) => void;
}

const inputCls =
  'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border';

export function Step5KindnessOptIn({ value, onChange }: Props) {
  const toggleAct = (act: string) => {
    onChange({ ...value, acts: value.acts.includes(act) ? value.acts.filter((a) => a !== act) : [...value.acts, act] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-brand-primary/5 border border-brand-primary/20 p-4">
        <Sprout className="w-6 h-6 text-brand-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-heading font-semibold text-brand-text">7-Day Kindness Challenge</p>
          <p className="text-sm text-brand-muted mt-1">
            Small Acts • Real Impact • One Week. Perform at least one small act of kindness every day for 7 days.
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-brand-border px-3 py-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value.optedIn}
          onChange={(e) => onChange({ ...value, optedIn: e.target.checked })}
          className="accent-brand-primary w-5 h-5 mt-0.5"
        />
        <span className="text-sm text-brand-text">I am ready to take the 7-Day Kindness Challenge!</span>
      </label>

      {value.optedIn && (
        <>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium text-brand-text">Acts you're willing to do</legend>
            {ACTS.map((act) => (
              <label key={act} className="flex items-start gap-2 rounded-lg border border-brand-border px-3 py-2 cursor-pointer">
                <input type="checkbox" checked={value.acts.includes(act)} onChange={() => toggleAct(act)} className="accent-brand-primary mt-0.5" />
                <span className="text-sm">{act}</span>
              </label>
            ))}
            <div className="flex gap-2 pt-1">
              <input
                aria-label="Other act of kindness"
                placeholder="Other: type your own act…"
                className={inputCls}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v && !value.acts.includes(v)) onChange({ ...value, acts: [...value.acts, v] });
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
            <p className="text-xs text-brand-muted">Custom acts you type are added to your selected list.</p>
          </fieldset>

          <div className="space-y-1.5">
            <label htmlFor="kcStartDate" className="text-sm font-medium text-brand-text">Date of Commencing *</label>
            <input
              id="kcStartDate"
              type="date"
              className={inputCls}
              value={value.startDate}
              onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            />
          </div>
        </>
      )}
    </div>
  );
}

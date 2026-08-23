'use client';

import type { StepProps } from './StepProps';
import { FieldError } from './StepProps';

const SOURCES = [
  { value: 'FRIEND', label: 'Friend', needsName: true },
  { value: 'COLLEGE', label: 'College / University', needsName: true },
  { value: 'PARTNER_ORG', label: 'Partner Organization', needsName: true },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'CURRENT_VOLUNTEER', label: 'Current Volunteer', needsName: true },
  { value: 'NEWSPAPER', label: 'Newspaper' },
  { value: 'EVENT', label: 'Event' },
  { value: 'OTHER', label: 'Other' },
];

const inputCls =
  'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border';

export function Step4Referral({ register, watch, errors }: StepProps) {
  const source = watch('referralSource');
  const needsName = SOURCES.find((s) => s.value === source)?.needsName;

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">How did you hear about us? *</legend>
        <div className="space-y-2">
          {SOURCES.map((s) => (
            <label key={s.value} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 min-h-11 cursor-pointer">
              <input type="radio" value={s.value} className="accent-brand-primary" {...register('referralSource')} />
              <span className="text-sm">{s.label}</span>
            </label>
          ))}
        </div>
        <FieldError message={errors.referralSource?.message} />
      </fieldset>

      {needsName && (
        <div className="space-y-1.5">
          <label htmlFor="referralSourceName" className="text-sm font-medium text-brand-text">Name of reference *</label>
          <input id="referralSourceName" className={inputCls} {...register('referralSourceName')} />
          <FieldError message={errors.referralSourceName?.message as string} />
        </div>
      )}
    </div>
  );
}

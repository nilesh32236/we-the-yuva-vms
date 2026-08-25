'use client';
import type { StepProps } from './StepProps';
import { FieldError } from './StepProps';

const inputCls = 'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border';

export function Step5Background({ register, watch, errors }: StepProps) {
  const hasVol = watch('hasVolunteered');
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="preferredCityArea" className="text-sm font-medium text-brand-text">Preferred City / Area</label>
        <input id="preferredCityArea" maxLength={200} className={inputCls} placeholder="e.g. Pune, Kothrud" {...register('preferredCityArea')} />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">Max travel distance</legend>
        <div className="flex gap-2 flex-wrap">
          {['WITHIN_5_KM','WITHIN_10_KM','ANYWHERE'].map((v) => (
            <label key={v} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 cursor-pointer">
              <input type="radio" value={v} className="accent-brand-primary" {...register('maxTravelDistance')} />
              <span className="text-sm">{v.replaceAll('_',' ')}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 cursor-pointer">
        <input type="checkbox" className="accent-brand-primary" {...register('remoteAvailable')} />
        <span className="text-sm">Available for remote volunteering</span>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">Have you volunteered before? *</legend>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 cursor-pointer">
            <input type="radio" value="true" className="accent-brand-primary" {...register('hasVolunteered', { setValueAs: (v) => v === 'true' })} />
            <span className="text-sm">Yes</span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 cursor-pointer">
            <input type="radio" value="false" className="accent-brand-primary" {...register('hasVolunteered', { setValueAs: (v) => v === 'true' })} />
            <span className="text-sm">No</span>
          </label>
        </div>
        <FieldError message={errors.hasVolunteered?.message as string} />
      </fieldset>

      {hasVol && (
        <div className="space-y-3 rounded-lg border border-brand-border p-3">
          <div className="space-y-1.5">
            <label htmlFor="previousOrgName" className="text-sm font-medium text-brand-text">Previous organization *</label>
            <input id="previousOrgName" maxLength={120} className={inputCls} {...register('previousOrgName')} />
            <FieldError message={errors.previousOrgName?.message as string} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="previousRole" className="text-sm font-medium text-brand-text">Previous role *</label>
            <input id="previousRole" maxLength={120} className={inputCls} {...register('previousRole')} />
            <FieldError message={errors.previousRole?.message as string} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="previousDurationNature" className="text-sm font-medium text-brand-text">Duration & nature</label>
            <textarea id="previousDurationNature" rows={2} maxLength={500} className={inputCls} {...register('previousDurationNature')} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="previousTotalHours" className="text-sm font-medium text-brand-text">Total hours</label>
            <input id="previousTotalHours" type="number" step="0.1" inputMode="decimal" className={inputCls} {...register('previousTotalHours')} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {[
          { id: 'linkedinUrl', label: 'LinkedIn URL' },
          { id: 'instagramUrl', label: 'Instagram URL' },
          { id: 'twitterUrl', label: 'Twitter URL' },
          { id: 'portfolioUrl', label: 'Portfolio URL' },
        ].map((f) => (
          <div key={f.id} className="space-y-1.5">
            <label htmlFor={f.id} className="text-sm font-medium text-brand-text">{f.label}</label>
            <input id={f.id} type="url" placeholder="https://" className={inputCls} {...register(f.id as never)} />
            <FieldError message={(errors as Record<string, { message?: string }>)[f.id]?.message} />
          </div>
        ))}
      </div>
    </div>
  );
}

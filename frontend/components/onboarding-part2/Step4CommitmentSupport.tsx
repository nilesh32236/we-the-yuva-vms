'use client';
import type { StepProps } from './StepProps';
import { FieldError } from './StepProps';

const inputCls = 'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border';

export function Step4CommitmentSupport({ register, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">Volunteer Role Tier *</legend>
        <div className="grid grid-cols-1 gap-2">
          {['GENERAL_VOLUNTEER','LEADER','COORDINATOR','MANAGEMENT','INTERN'].map((v) => (
            <label key={v} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 min-h-11 cursor-pointer">
              <input type="radio" value={v} className="accent-brand-primary" {...register('volunteerRoleTier')} />
              <span className="text-sm">{v.replaceAll('_',' ')}</span>
            </label>
          ))}
        </div>
        <FieldError message={errors.volunteerRoleTier?.message as string} />
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">Preferred Days</legend>
        <div className="flex gap-2">
          {['WEEKDAYS','WEEKENDS'].map((v) => (
            <label key={v} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 cursor-pointer">
              <input type="checkbox" value={v} className="accent-brand-primary" {...register('preferredDays')} />
              <span className="text-sm">{v}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">Preferred Time Slots</legend>
        <div className="flex gap-2 flex-wrap">
          {['MORNING','AFTERNOON','EVENING'].map((v) => (
            <label key={v} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 cursor-pointer">
              <input type="checkbox" value={v} className="accent-brand-primary" {...register('preferredTimeSlots')} />
              <span className="text-sm">{v}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-1.5">
        <label htmlFor="specificDaysTimes" className="text-sm font-medium text-brand-text">Specific days & times</label>
        <input id="specificDaysTimes" placeholder="e.g. Mon/Wed evenings" maxLength={300} className={inputCls} {...register('specificDaysTimes')} />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">Support & Resources you'd like</legend>
        <div className="grid grid-cols-1 gap-2">
          {['COUNSELING','MENTORSHIP','COACHING','NEED_BASED_CAPACITY_BUILDING'].map((v) => (
            <label key={v} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 cursor-pointer">
              <input type="checkbox" value={v} className="accent-brand-primary" {...register('supportResources')} />
              <span className="text-sm">{v.replaceAll('_',' ')}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

'use client';

import type { UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import type { OnboardingData } from '@/lib/shared';
import { VOLUNTEER_TYPES, AVAILABILITY_PATTERNS } from '@/lib/shared';
import { ChipSelect } from './ChipSelect';

interface StepAvailabilityProps {
  setValue: UseFormSetValue<OnboardingData>;
  watch: UseFormWatch<OnboardingData>;
  errors: FieldErrors<OnboardingData>;
}

export function StepAvailability({ setValue, watch, errors }: StepAvailabilityProps) {
  const volunteerType = watch('step3.volunteerType');
  const availabilityPattern = watch('step3.availabilityPattern');

  const commonInput = (
    label: string,
    value: string | number,
    onChange: (v: string) => void,
    placeholder = '',
    type = 'text',
    error?: string,
  ) => {
    const id = `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium text-brand-text">{label}</label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
            error ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'
          }`}
        />
        {error && (
          <p id={`${id}-error`} className="text-brand-error text-xs" role="alert">{error}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <h2 className="font-heading font-semibold text-xl text-brand-text">Availability</h2>
      <p className="text-brand-muted text-sm -mt-3">Let us know your availability preferences</p>

      <div className="space-y-5">
        <div className="space-y-2">
          <span className="text-sm font-medium text-brand-text">Volunteer Type *</span>
          <p className="text-xs text-brand-muted">What type of volunteering suits you best?</p>
          <ChipSelect
            options={VOLUNTEER_TYPES}
            selected={volunteerType ? [volunteerType] : []}
            toggle={(val) => setValue('step3.volunteerType', val as never, { shouldValidate: true })}
            labelMap={{
              STUDENT: 'Student', PROFESSIONAL: 'Professional', EVENT: 'Event Based',
              RECURRING: 'Recurring / Regular', REMOTE: 'Remote', EMERGENCY: 'Emergency Response',
            }}
            error={errors.step3?.volunteerType?.message}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-brand-text">Availability Pattern *</span>
          <p className="text-xs text-brand-muted">When are you typically available?</p>
          <ChipSelect
            options={AVAILABILITY_PATTERNS}
            selected={availabilityPattern ? [availabilityPattern] : []}
            toggle={(val) => setValue('step3.availabilityPattern', val as never, { shouldValidate: true })}
            labelMap={{
              WEEKDAYS: 'Weekdays', WEEKENDS: 'Weekends', BOTH: 'Both Weekdays & Weekends', FLEXIBLE: 'Flexible',
            }}
            error={errors.step3?.availabilityPattern?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {commonInput(
            'Hours per Week *',
            watch('step3.hoursPerWeek') ?? '',
            (v) => setValue('step3.hoursPerWeek', Number(v), { shouldValidate: true }),
            'e.g. 5',
            'number',
            errors.step3?.hoursPerWeek?.message,
          )}
          {commonInput(
            'Session Duration (hrs) *',
            watch('step3.sessionDuration') ?? '',
            (v) => setValue('step3.sessionDuration', Number(v), { shouldValidate: true }),
            'e.g. 2',
            'number',
            errors.step3?.sessionDuration?.message,
          )}
        </div>
      </div>
    </>
  );
}

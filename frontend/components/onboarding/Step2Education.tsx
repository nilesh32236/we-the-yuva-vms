'use client';

import type { StepProps } from './StepProps';
import { FieldError } from './StepProps';

const STATUSES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'WORKING_PROFESSIONAL', label: 'Working Professional' },
  { value: 'SELF_EMPLOYED', label: 'Self-employed' },
  { value: 'HOMEMAKER', label: 'Homemaker' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'JOB_SEEKER', label: 'Job Seeker' },
  { value: 'OTHER', label: 'Other' },
];

const inputCls =
  'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border';

export function Step2Education({ register, watch, errors }: StepProps) {
  const status = watch('currentStatus');
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="education" className="text-sm font-medium text-brand-text">Highest Qualification *</label>
        <input id="education" placeholder="e.g. B.Tech, 12th, Diploma" className={inputCls} {...register('education')} />
        <FieldError message={errors.education?.message} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="fieldOfStudy" className="text-sm font-medium text-brand-text">Field of Study</label>
        <input id="fieldOfStudy" placeholder="e.g. Computer Science" className={inputCls} {...register('fieldOfStudy')} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">Current Status *</legend>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => (
            <label key={s.value} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 min-h-11 cursor-pointer has-checked:bg-brand-primary/10">
              <input type="radio" value={s.value} className="accent-brand-primary" {...register('currentStatus')} />
              <span className="text-sm">{s.label}</span>
            </label>
          ))}
        </div>
        <FieldError message={errors.currentStatus?.message} />
      </fieldset>

      {status === 'STUDENT' && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-brand-border p-4">
          <input aria-label="College/University Name *" placeholder="College / University *" className={`${inputCls} col-span-2`} {...register('student.institution')} />
          <FieldError message={errors.student?.institution?.message} />
          <input aria-label="Course *" placeholder="Course *" className={inputCls} {...register('student.course')} />
          <input aria-label="Year/Semester *" placeholder="Year / Semester *" className={inputCls} {...register('student.yearSemester')} />
          <input aria-label="City *" placeholder="City *" className={`${inputCls} col-span-2`} {...register('student.city')} />
        </div>
      )}

      {status === 'WORKING_PROFESSIONAL' && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-brand-border p-4">
          <input aria-label="Company Name *" placeholder="Company Name *" className={inputCls} {...register('professional.company')} />
          <input aria-label="Designation *" placeholder="Designation *" className={inputCls} {...register('professional.designation')} />
          <input aria-label="Industry *" placeholder="Industry *" className={inputCls} {...register('professional.industry')} />
          <input aria-label="City *" placeholder="City *" className={inputCls} {...register('professional.city')} />
        </div>
      )}

      {(status === 'SELF_EMPLOYED' || status === 'OTHER') && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-brand-border p-4">
          <input aria-label="Profession *" placeholder="Profession *" className={inputCls} {...register('selfEmployed.profession')} />
          <input aria-label="Organization Name" placeholder="Organization (optional)" className={inputCls} {...register('selfEmployed.organizationName')} />
          <input aria-label="City *" placeholder="City *" className={`${inputCls} col-span-2`} {...register('selfEmployed.city')} />
        </div>
      )}

      {status === 'RETIRED' && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-brand-border p-4">
          <input aria-label="Past Profession *" placeholder="Past Profession *" className={inputCls} {...register('retired.pastProfession')} />
          <FieldError message={errors.retired?.pastProfession?.message} />
        </div>
      )}
    </div>
  );
}

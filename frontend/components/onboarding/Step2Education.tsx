'use client';

import { cn } from '@/lib/utils';
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

const inputBase =
  'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary';

export function Step2Education({ register, watch, errors }: StepProps) {
  const status = watch('currentStatus');
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="education" className="text-sm font-medium text-brand-text">Highest Qualification *</label>
        <input
          id="education"
          placeholder="e.g. B.Tech, 12th, Diploma"
          aria-invalid={!!errors.education}
          aria-describedby={errors.education ? 'education-error' : undefined}
          className={cn(inputBase, errors.education ? 'border-brand-error' : 'border-brand-border')}
          {...register('education')}
        />
        <FieldError id="education-error" message={errors.education?.message} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="fieldOfStudy" className="text-sm font-medium text-brand-text">Field of Study</label>
        <input id="fieldOfStudy" placeholder="e.g. Computer Science" className={cn(inputBase, 'border-brand-border')} {...register('fieldOfStudy')} />
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
        <FieldError id="currentStatus-error" message={errors.currentStatus?.message} />
      </fieldset>

      {status === 'STUDENT' && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-brand-border p-4">
          <input aria-label="College/University Name *" placeholder="College / University *" aria-invalid={!!errors.student?.institution} aria-describedby={errors.student?.institution ? 'student-institution-error' : undefined} className={cn(inputBase, errors.student?.institution ? 'border-brand-error' : 'border-brand-border', 'col-span-2')} {...register('student.institution')} />
          <FieldError id="student-institution-error" message={errors.student?.institution?.message} />
          <div className="space-y-1">
            <input aria-label="Course *" placeholder="Course *" aria-invalid={!!errors.student?.course} aria-describedby={errors.student?.course ? 'student-course-error' : undefined} className={cn(inputBase, errors.student?.course ? 'border-brand-error' : 'border-brand-border')} {...register('student.course')} />
            <FieldError id="student-course-error" message={errors.student?.course?.message} />
          </div>
          <div className="space-y-1">
            <input aria-label="Year/Semester *" placeholder="Year / Semester *" aria-invalid={!!errors.student?.yearSemester} aria-describedby={errors.student?.yearSemester ? 'student-year-error' : undefined} className={cn(inputBase, errors.student?.yearSemester ? 'border-brand-error' : 'border-brand-border')} {...register('student.yearSemester')} />
            <FieldError id="student-year-error" message={errors.student?.yearSemester?.message} />
          </div>
          <div className="space-y-1 col-span-2">
            <input aria-label="City *" placeholder="City *" aria-invalid={!!errors.student?.city} aria-describedby={errors.student?.city ? 'student-city-error' : undefined} className={cn(inputBase, errors.student?.city ? 'border-brand-error' : 'border-brand-border')} {...register('student.city')} />
            <FieldError id="student-city-error" message={errors.student?.city?.message} />
          </div>
        </div>
      )}

      {status === 'WORKING_PROFESSIONAL' && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-brand-border p-4">
          <div className="space-y-1">
            <input aria-label="Company Name *" placeholder="Company Name *" aria-invalid={!!errors.professional?.company} aria-describedby={errors.professional?.company ? 'professional-company-error' : undefined} className={cn(inputBase, errors.professional?.company ? 'border-brand-error' : 'border-brand-border')} {...register('professional.company')} />
            <FieldError id="professional-company-error" message={errors.professional?.company?.message} />
          </div>
          <div className="space-y-1">
            <input aria-label="Designation *" placeholder="Designation *" aria-invalid={!!errors.professional?.designation} aria-describedby={errors.professional?.designation ? 'professional-designation-error' : undefined} className={cn(inputBase, errors.professional?.designation ? 'border-brand-error' : 'border-brand-border')} {...register('professional.designation')} />
            <FieldError id="professional-designation-error" message={errors.professional?.designation?.message} />
          </div>
          <div className="space-y-1">
            <input aria-label="Industry *" placeholder="Industry *" aria-invalid={!!errors.professional?.industry} aria-describedby={errors.professional?.industry ? 'professional-industry-error' : undefined} className={cn(inputBase, errors.professional?.industry ? 'border-brand-error' : 'border-brand-border')} {...register('professional.industry')} />
            <FieldError id="professional-industry-error" message={errors.professional?.industry?.message} />
          </div>
          <div className="space-y-1">
            <input aria-label="City *" placeholder="City *" aria-invalid={!!errors.professional?.city} aria-describedby={errors.professional?.city ? 'professional-city-error' : undefined} className={cn(inputBase, errors.professional?.city ? 'border-brand-error' : 'border-brand-border')} {...register('professional.city')} />
            <FieldError id="professional-city-error" message={errors.professional?.city?.message} />
          </div>
        </div>
      )}

      {(status === 'SELF_EMPLOYED' || status === 'OTHER') && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-brand-border p-4">
          <div className="space-y-1">
            <input aria-label="Profession *" placeholder="Profession *" aria-invalid={!!errors.selfEmployed?.profession} aria-describedby={errors.selfEmployed?.profession ? 'selfEmployed-profession-error' : undefined} className={cn(inputBase, errors.selfEmployed?.profession ? 'border-brand-error' : 'border-brand-border')} {...register('selfEmployed.profession')} />
            <FieldError id="selfEmployed-profession-error" message={errors.selfEmployed?.profession?.message} />
          </div>
          <input aria-label="Organization Name" placeholder="Organization (optional)" className={cn(inputBase, 'border-brand-border')} {...register('selfEmployed.organizationName')} />
          <div className="space-y-1 col-span-2">
            <input aria-label="City *" placeholder="City *" aria-invalid={!!errors.selfEmployed?.city} aria-describedby={errors.selfEmployed?.city ? 'selfEmployed-city-error' : undefined} className={cn(inputBase, errors.selfEmployed?.city ? 'border-brand-error' : 'border-brand-border')} {...register('selfEmployed.city')} />
            <FieldError id="selfEmployed-city-error" message={errors.selfEmployed?.city?.message} />
          </div>
        </div>
      )}

      {status === 'RETIRED' && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-brand-border p-4">
          <input aria-label="Past Profession *" placeholder="Past Profession *" aria-invalid={!!errors.retired?.pastProfession} aria-describedby={errors.retired?.pastProfession ? 'retired-pastProfession-error' : undefined} className={cn(inputBase, errors.retired?.pastProfession ? 'border-brand-error' : 'border-brand-border')} {...register('retired.pastProfession')} />
          <FieldError id="retired-pastProfession-error" message={errors.retired?.pastProfession?.message} />
        </div>
      )}
    </div>
  );
}

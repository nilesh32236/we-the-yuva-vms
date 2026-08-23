'use client';

import { useState } from 'react';
import type { StepProps } from './StepProps';
import { FieldError } from './StepProps';

const TYPES = [
  { value: 'STUDENT_VOLUNTEER', label: 'Student Volunteer' },
  { value: 'LONG_TERM', label: 'Long-term Volunteer' },
  { value: 'INTERNSHIP', label: 'Internship Volunteer' },
  { value: 'OTHER', label: 'Other' },
];
const INTERESTS = [
  { value: 'EDUCATION', label: 'Education' },
  { value: 'ACTIVE_CITIZENSHIP', label: 'Active Citizenship Leadership' },
  { value: 'ENVIRONMENT', label: 'Environment' },
];
const TOOLS = ['Zoom/Meet', 'Google Forms', 'Excel', 'Word', 'Data Entry', 'Emailing'];

const inputCls =
  'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border';

const YESNO = [
  { value: 'smartphone', label: 'Do you have a smartphone?' },
  { value: 'whatsapp', label: 'Do you use WhatsApp?' },
  { value: 'laptop', label: 'Do you have a laptop/computer?' },
  { value: 'onlineVolunteering', label: 'Are you comfortable with online volunteering?' },
] as const;

export function Step3VolunteerProfile({ register, setValue, watch, errors }: StepProps) {
  const skills = watch('skills') ?? [];
  const tools = watch('digitalReadiness.tools') ?? [];
  const [skillDraft, setSkillDraft] = useState('');

  const addSkill = () => {
    const v = skillDraft.trim();
    if (v && !skills.includes(v)) setValue('skills', [...skills, v], { shouldValidate: true });
    setSkillDraft('');
  };
  const toggleTool = (t: string) => {
    setValue(
      'digitalReadiness.tools',
      tools.includes(t) ? tools.filter((x) => x !== t) : [...tools, t],
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">Volunteer Type *</legend>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <label key={t.value} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 min-h-11 cursor-pointer">
              <input type="radio" value={t.value} className="accent-brand-primary" {...register('volunteerType')} />
              <span className="text-sm">{t.label}</span>
            </label>
          ))}
        </div>
        <FieldError message={errors.volunteerType?.message} />
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="hoursPerWeek" className="text-sm font-medium text-brand-text">Hours per week</label>
          <input id="hoursPerWeek" type="number" min={0} max={100} className={inputCls} {...register('timeCommitment.hoursPerWeek')} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="hoursPerMonth" className="text-sm font-medium text-brand-text">Hours per month</label>
          <input id="hoursPerMonth" type="number" min={0} max={500} className={inputCls} {...register('timeCommitment.hoursPerMonth')} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <label htmlFor="preferredDaysTimes" className="text-sm font-medium text-brand-text">Preferred days &amp; times</label>
          <input id="preferredDaysTimes" placeholder="e.g. Weekends, 10am–1pm" className={inputCls} {...register('timeCommitment.preferredDaysTimes')} />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">Opportunities that interest you *</legend>
        <div className="space-y-2">
          {INTERESTS.map((i) => (
            <label key={i.value} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 min-h-11 cursor-pointer">
              <input type="checkbox" value={i.value} className="accent-brand-primary" {...register('opportunityInterests')} />
              <span className="text-sm">{i.label}</span>
            </label>
          ))}
        </div>
        <FieldError message={errors.opportunityInterests?.message as string} />
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="whyVoluntary" className="text-sm font-medium text-brand-text">
          What is your motivation for volunteering? *
        </label>
        <textarea id="whyVoluntary" rows={3} maxLength={500} className={inputCls} {...register('whyVoluntary')} />
        <FieldError message={errors.whyVoluntary?.message} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="skills" className="text-sm font-medium text-brand-text">Skills you'd like to offer *</label>
        <div className="flex gap-2">
          <input
            id="skills"
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
            }}
            className={inputCls}
          />
          <button type="button" onClick={addSkill} className="px-4 rounded-lg bg-brand-primary/10 text-brand-primary text-sm min-h-11 cursor-pointer">Add</button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 bg-brand-primary/10 text-brand-primary rounded-full px-3 py-1 text-xs">
                {s}
                <button type="button" aria-label={`Remove ${s}`} onClick={() => setValue('skills', skills.filter((x) => x !== s), { shouldValidate: true })} className="cursor-pointer">×</button>
              </span>
            ))}
          </div>
        )}
        <FieldError message={errors.skills?.message as string} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">Digital Readiness</legend>
        {YESNO.map((q) => (
          <label key={q.value} className="flex items-center justify-between gap-3 rounded-lg border border-brand-border px-3 py-2.5">
            <span className="text-sm">{q.label}</span>
            <input type="checkbox" className="accent-brand-primary w-5 h-5" {...register(`digitalReadiness.${q.value}`)} />
          </label>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          {TOOLS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTool(t)}
              className={`rounded-full px-3 py-1.5 text-xs border cursor-pointer ${tools.includes(t) ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-border text-brand-muted'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

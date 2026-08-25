'use client';
import type { StepProps } from './StepProps';
import { FieldError } from './StepProps';

const ROLES = [
  'CAPACITY_BUILDER_TRAINER',
  'COMMUNITY_OUTREACH_SURVEY',
  'GRIEVANCE_SUPPORT_FACILITATOR',
  'SOLUTION_CAMP_COORDINATOR',
  'STAKEHOLDER_LIAISON',
  'WARD_AREA_AMBASSADOR',
  'PROGRAMME_DATA_SUPPORTER',
  'VOLUNTEER_ENGAGEMENT_SUPPORTER',
] as const;

const inputCls = 'w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border text-sm';

export function Step2Roles({ register, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-muted">For each role, tell us what you can offer and what you want to develop (max 500 each).</p>
      {ROLES.map((role, idx) => (
        <fieldset key={role} className="rounded-lg border border-brand-border p-3 space-y-2">
          <legend className="text-sm font-medium text-brand-text px-1">{idx + 1}. {role.replaceAll('_', ' ')}</legend>
          <input type="hidden" {...register(`roleMappings.${idx}.role` as const)} value={role} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-brand-muted">Skills you offer</label>
              <input placeholder="e.g. facilitation, outreach" className={inputCls} {...register(`roleMappings.${idx}.skillsOffer` as const)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-brand-muted">Skills you want to develop</label>
              <input placeholder="e.g. leadership, data" className={inputCls} {...register(`roleMappings.${idx}.skillsDevelop` as const)} />
            </div>
          </div>
        </fieldset>
      ))}
      <FieldError message={(errors.roleMappings as { message?: string })?.message} />
    </div>
  );
}

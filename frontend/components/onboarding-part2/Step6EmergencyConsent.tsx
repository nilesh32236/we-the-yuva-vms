'use client';
import type { StepProps } from './StepProps';
import { FieldError } from './StepProps';

const inputCls = 'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border';

export function Step6EmergencyConsent({ register, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="emergencyContactName" className="text-sm font-medium text-brand-text">Emergency contact name *</label>
        <input id="emergencyContactName" maxLength={80} className={inputCls} {...register('emergencyContactName')} />
        <FieldError message={errors.emergencyContactName?.message as string} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="emergencyRelationship" className="text-sm font-medium text-brand-text">Relationship *</label>
        <input id="emergencyRelationship" maxLength={40} className={inputCls} placeholder="e.g. Father, Friend" {...register('emergencyRelationship')} />
        <FieldError message={errors.emergencyRelationship?.message as string} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="emergencyMobile" className="text-sm font-medium text-brand-text">Emergency mobile *</label>
        <input id="emergencyMobile" placeholder="+919876543210" className={inputCls} {...register('emergencyMobile')} />
        <FieldError message={errors.emergencyMobile?.message as string} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="medicalConditions" className="text-sm font-medium text-brand-text">Medical conditions (optional)</label>
        <textarea id="medicalConditions" rows={3} maxLength={500} className={inputCls} placeholder="Any medical conditions we should know about..." {...register('medicalConditions')} />
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-brand-text">Declarations *</legend>
        <label className="flex items-start gap-2 rounded-lg border border-brand-border px-3 py-2.5 cursor-pointer">
          <input type="checkbox" className="accent-brand-primary mt-1" {...register('privacyPolicyConsent')} />
          <span className="text-sm">I accept the Privacy Policy *</span>
        </label>
        <FieldError message={errors.privacyPolicyConsent?.message as string} />
        <label className="flex items-start gap-2 rounded-lg border border-brand-border px-3 py-2.5 cursor-pointer">
          <input type="checkbox" className="accent-brand-primary mt-1" {...register('codeOfConductConsent')} />
          <span className="text-sm">I accept the Code of Conduct *</span>
        </label>
        <FieldError message={errors.codeOfConductConsent?.message as string} />
        <label className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 cursor-pointer">
          <input type="checkbox" className="accent-brand-primary" {...register('mediaConsent')} />
          <span className="text-sm">I consent to media use (photos/videos)</span>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 cursor-pointer">
          <input type="checkbox" className="accent-brand-primary" {...register('whatsappConsent')} />
          <span className="text-sm">I consent to WhatsApp updates</span>
        </label>
      </fieldset>
    </div>
  );
}

'use client';

import type { StepProps } from './StepProps';
import { FieldError } from './StepProps';

export function Step6Declaration({ register, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-heading font-semibold text-lg text-brand-text">Declaration &amp; Commitment</h2>
      <label className="flex items-start gap-3 rounded-lg border border-brand-border px-3 py-3 cursor-pointer">
        <input type="checkbox" className="accent-brand-primary w-5 h-5 mt-0.5" {...register('declarations.infoCorrect')} />
        <span className="text-sm text-brand-text">
          I hereby declare that the above information is correct and I am committed to offering my services voluntarily without any pressure. *
        </span>
      </label>
      <FieldError message={(errors.declarations?.infoCorrect?.message as string) ?? errors.declarations?.root?.message} />
      <label className="flex items-start gap-3 rounded-lg border border-brand-border px-3 py-3 cursor-pointer">
        <input type="checkbox" className="accent-brand-primary w-5 h-5 mt-0.5" {...register('declarations.commitmentsAccepted')} />
        <span className="text-sm text-brand-text">
          I commit to attending meetings, following instructions provided, and seeking clarity whenever needed. *
        </span>
      </label>
      <FieldError message={errors.declarations?.commitmentsAccepted?.message as string} />
    </div>
  );
}

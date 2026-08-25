'use client';
import type { StepProps } from './StepProps';
import { FieldError } from './StepProps';

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const inputCls = 'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border';

export function Step1Reflection({ register, watch, errors }: StepProps) {
  const reflection = watch('kindnessReflection') ?? '';
  const wc = wordCount(reflection);
  const wcColor = wc < 50 || wc > 200 ? 'text-brand-error' : 'text-brand-muted';
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="kindnessReflection" className="text-sm font-medium text-brand-text">Kindness Reflection * (50–200 words)</label>
        <textarea id="kindnessReflection" rows={5} className={inputCls} placeholder="Reflect on your Kindness Challenge journey..." {...register('kindnessReflection')} />
        <div className="flex justify-between text-xs">
          <FieldError message={errors.kindnessReflection?.message as string} />
          <span className={wcColor}>{wc} words</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="aspirations" className="text-sm font-medium text-brand-text">Aspirations * (max 1000)</label>
        <textarea id="aspirations" rows={4} maxLength={1000} className={inputCls} placeholder="Your aspirations as a volunteer..." {...register('aspirations')} />
        <FieldError message={errors.aspirations?.message as string} />
      </div>
    </div>
  );
}

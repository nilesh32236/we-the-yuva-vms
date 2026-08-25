'use client';
import { Button } from '@/components/ui/Button';
import type { StepProps } from './StepProps';
import { FieldError } from './StepProps';

const LIFE_SKILLS = [
  'COMMUNICATION',
  'PROBLEM_SOLVING',
  'CRITICAL_THINKING',
  'DIGITAL_LITERACY',
  'SELF_CONFIDENCE',
  'LEADERSHIP',
  'TEAMWORK',
  'PUBLIC_SPEAKING',
  'OTHER',
] as const;

const inputCls =
  'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border';

export function Step3SkillsLanguages({ register, watch, setValue, errors }: StepProps) {
  const lifeSkills = watch('lifeSkills') ?? [];
  const showOther = lifeSkills.includes('OTHER');
  const languages = watch('languages') ?? [];

  const addLanguage = () => {
    if (languages.length >= 10) return;
    setValue('languages', [...languages, { language: '', proficiency: 'BASIC' } as never], {
      shouldValidate: true,
    });
  };
  const removeLanguage = (idx: number) => {
    setValue('languages', languages.filter((_, i) => i !== idx) as never, { shouldValidate: true });
  };

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">
          Life Skills * (select at least 2)
        </legend>
        <div className="grid grid-cols-1 gap-2">
          {LIFE_SKILLS.map((s) => (
            <label
              key={s}
              className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 min-h-11 cursor-pointer"
            >
              <input
                type="checkbox"
                value={s}
                className="accent-brand-primary"
                {...register('lifeSkills')}
              />
              <span className="text-sm">{s.replaceAll('_', ' ')}</span>
            </label>
          ))}
        </div>
        <FieldError message={errors.lifeSkills?.message as string} />
      </fieldset>
      {showOther && (
        <div className="space-y-1.5">
          <label htmlFor="lifeSkillsOther" className="text-sm font-medium text-brand-text">
            Please specify other skill *
          </label>
          <input id="lifeSkillsOther" className={inputCls} {...register('lifeSkillsOther')} />
          <FieldError message={errors.lifeSkillsOther?.message as string} />
        </div>
      )}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-text">Languages (up to 10)</legend>
        {languages.map((_, idx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: language order is stable for form indices
          <div key={idx} className="grid grid-cols-5 gap-2 items-center">
            <input
              placeholder="Language"
              className={`${inputCls} col-span-2`}
              {...register(`languages.${idx}.language` as const)}
            />
            <select
              className={`${inputCls} col-span-2`}
              {...register(`languages.${idx}.proficiency` as const)}
            >
              <option value="BASIC">BASIC</option>
              <option value="INTERMEDIATE">INTERMEDIATE</option>
              <option value="FLUENT">FLUENT</option>
            </select>
            <Button
              type="button"
              variant="ghost"
              className="text-brand-error px-2 min-h-11 cursor-pointer hover:bg-brand-error/10"
              onClick={() => removeLanguage(idx)}
            >
              Remove
            </Button>
          </div>
        ))}
        {languages.length < 10 && (
          <Button
            type="button"
            variant="outline"
            className="text-brand-primary border-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20"
            onClick={addLanguage}
          >
            Add language
          </Button>
        )}
        <FieldError message={errors.languages?.message as string} />
      </fieldset>
    </div>
  );
}

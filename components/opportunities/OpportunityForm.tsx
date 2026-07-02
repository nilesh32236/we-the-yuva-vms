'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { type OpportunityInput, OpportunitySchema } from '@/lib/shared';
import { Button } from '../ui/Button';

const CATEGORIES = [
  'EDUCATION',
  'HEALTH',
  'ENVIRONMENT',
  'COMMUNITY',
  'ARTS',
  'SPORTS',
  'TECHNOLOGY',
  'ACTIVE_CITIZENSHIP',
  'OTHER',
] as const;

interface OpportunityFormProps {
  defaultValues?: Partial<OpportunityInput>;
  onSubmit: (data: OpportunityInput) => Promise<void>;
  submitLabel?: string;
}

export function OpportunityForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
}: OpportunityFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OpportunityInput>({
    resolver: zodResolver(OpportunitySchema),
    defaultValues: { isRemote: false, skills: [], ...defaultValues },
  });

  const [skillInput, setSkillInput] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const wrappedOnSubmit = async (data: OpportunityInput) => {
    setServerError(null);
    try {
      await onSubmit(data);
    } catch (err: unknown) {
      const msg =
        (err as { normalizedMessage?: string })?.normalizedMessage ??
        (err as Error)?.message ??
        'Something went wrong';
      setServerError(msg);
    }
  };
  const skills = watch('skills') ?? [];
  const isRemote = watch('isRemote');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 10) {
      setValue('skills', [...skills, s]);
      setSkillInput('');
    }
  };

  const field = (
    id: keyof OpportunityInput,
    label: string,
    extra?: React.InputHTMLAttributes<HTMLInputElement>
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-brand-text">
        {label}
      </label>
      <input
        id={id}
        {...register(id)}
        {...extra}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary
          ${errors[id] ? 'border-brand-error' : 'border-brand-border'}`}
      />
      {errors[id] && <p className="text-xs text-brand-error">{errors[id]?.message as string}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(wrappedOnSubmit)} className="space-y-5">
      {serverError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {serverError}
        </div>
      )}

      {field('title', 'Title', { placeholder: 'e.g. Teaching Assistant at City School' })}

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium text-brand-text">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          placeholder="Describe the opportunity…"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none
            ${errors.description ? 'border-brand-error' : 'border-brand-border'}`}
        />
        {errors.description && (
          <p className="text-xs text-brand-error">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-sm font-medium text-brand-text">
            Category
          </label>
          <select
            id="category"
            {...register('category')}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-background
              ${errors.category ? 'border-brand-error' : 'border-brand-border'}`}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-brand-error">{errors.category.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="hoursPerSession" className="text-sm font-medium text-brand-text">
            Hours per session
          </label>
          <input
            id="hoursPerSession"
            type="number"
            step="0.5"
            min="0.5"
            placeholder="2"
            {...register('hoursPerSession', { valueAsNumber: true })}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.hoursPerSession ? 'border-brand-error' : 'border-brand-border'}`}
          />
          {errors.hoursPerSession && (
            <p className="text-xs text-brand-error">{errors.hoursPerSession.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="startDate" className="text-sm font-medium text-brand-text">
            Start date
          </label>
          <input
            id="startDate"
            type="datetime-local"
            {...register('startDate', {
              setValueAs: (v: string) => (v ? new Date(v).toISOString() : v),
            })}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.startDate ? 'border-brand-error' : 'border-brand-border'}`}
          />
          {errors.startDate && (
            <p className="text-xs text-brand-error">{errors.startDate.message as string}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="endDate" className="text-sm font-medium text-brand-text">
            End date
          </label>
          <input
            id="endDate"
            type="datetime-local"
            {...register('endDate', {
              setValueAs: (v: string) => (v ? new Date(v).toISOString() : v),
            })}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.endDate ? 'border-brand-error' : 'border-brand-border'}`}
          />
          {errors.endDate && (
            <p className="text-xs text-brand-error">{errors.endDate.message as string}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="totalSlots" className="text-sm font-medium text-brand-text">
          Total slots
        </label>
        <input
          id="totalSlots"
          type="number"
          min="1"
          placeholder="20"
          {...register('totalSlots', { valueAsNumber: true })}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.totalSlots ? 'border-brand-error' : 'border-brand-border'}`}
        />
        {errors.totalSlots && (
          <p className="text-xs text-brand-error">{errors.totalSlots.message}</p>
        )}
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <label htmlFor="opp-skill-input" className="text-sm font-medium text-brand-text">
          Required skills
        </label>
        <div className="flex flex-wrap gap-2 min-h-[36px]">
          {skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 bg-brand-bg border border-brand-border text-brand-text text-xs px-2.5 py-1 rounded-full"
            >
              {s}
              <button
                type="button"
                onClick={() =>
                  setValue(
                    'skills',
                    skills.filter((x) => x !== s)
                  )
                }
                className="cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="opp-skill-input"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="Add skill, press Enter"
            className="flex-1 px-3 py-2 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <Button type="button" variant="outline" onClick={addSkill}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {errors.skills && (
          <p className="text-xs text-brand-error">{errors.skills.message as string}</p>
        )}
      </div>

      {field('locationId', 'Location ID', { placeholder: 'Enter location ID' })}

      {/* Remote toggle */}
      <label htmlFor="isRemote" className="flex items-center gap-3 cursor-pointer">
        <div
          id="isRemote"
          role="switch"
          aria-checked={isRemote}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setValue('isRemote', !isRemote);
            }
          }}
          className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${isRemote ? 'bg-brand-primary' : 'bg-brand-border'}`}
          onClick={() => setValue('isRemote', !isRemote)}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow transition-transform duration-200 ${isRemote ? 'translate-x-5' : 'translate-x-1'}`}
          />
        </div>
        <span className="text-sm font-medium text-brand-text">Remote opportunity</span>
      </label>

      <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { type OpportunityInput, OpportunitySchema } from '@/lib/shared';
import { api } from '@/lib/api';
import { Button } from '../ui/Button';
import { useAuth } from '@/lib/auth-context';
import { hasPermission } from '@/lib/shared/permissions';
import * as Sentry from '@sentry/nextjs';

const CreateLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  district: z.string().optional(),
  state: z.string().optional(),
});

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
  requiredPermission?: string;
}

export function OpportunityForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
  requiredPermission,
}: OpportunityFormProps) {
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OpportunityInput>({
    resolver: zodResolver(OpportunitySchema),
    defaultValues: { isRemote: false, skills: [], ...defaultValues },
  });

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      reset(defaultValues);
      mounted.current = true;
    }
  }, [reset, defaultValues]);

  const [skillInput, setSkillInput] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return null;
  }

  const wrappedOnSubmit = async (data: OpportunityInput) => {
    setServerError(null);
    try {
      await onSubmit(data);
    } catch (err: unknown) {
      Sentry.captureException(err);
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
        disabled={isSubmitting}
        aria-invalid={!!errors[id]}
        aria-describedby={errors[id] ? `${id}-error` : undefined}
        {...register(id)}
        {...extra}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary
          ${errors[id] ? 'border-brand-error' : 'border-brand-border'}`}
      />
      {errors[id] && (
        <p id={`${id}-error`} className="text-xs text-brand-error">
          {errors[id]?.message as string}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(wrappedOnSubmit)} className="space-y-5">
      {serverError && (
        <div
          className="rounded-xl bg-brand-error/10 border border-brand-error/20 px-4 py-3 text-sm text-brand-error"
          role="alert"
        >
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
          disabled={isSubmitting}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          placeholder="Describe the opportunity…"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none
            ${errors.description ? 'border-brand-error' : 'border-brand-border'}`}
        />
        {errors.description && (
          <p id="description-error" className="text-xs text-brand-error">
            {errors.description.message}
          </p>
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
            disabled={isSubmitting}
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'category-error' : undefined}
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
          {errors.category && (
            <p id="category-error" className="text-xs text-brand-error">
              {errors.category.message}
            </p>
          )}
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
            disabled={isSubmitting}
            aria-invalid={!!errors.hoursPerSession}
            aria-describedby={errors.hoursPerSession ? 'hoursPerSession-error' : undefined}
            {...register('hoursPerSession', { valueAsNumber: true })}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.hoursPerSession ? 'border-brand-error' : 'border-brand-border'}`}
          />
          {errors.hoursPerSession && (
            <p id="hoursPerSession-error" className="text-xs text-brand-error">
              {errors.hoursPerSession.message}
            </p>
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
            disabled={isSubmitting}
            aria-invalid={!!errors.startDate}
            aria-describedby={errors.startDate ? 'startDate-error' : undefined}
            {...register('startDate', {
              setValueAs: (v: string) => (v ? new Date(v).toISOString() : v),
            })}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.startDate ? 'border-brand-error' : 'border-brand-border'}`}
          />
          {errors.startDate && (
            <p id="startDate-error" className="text-xs text-brand-error">
              {errors.startDate.message as string}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="endDate" className="text-sm font-medium text-brand-text">
            End date
          </label>
          <input
            id="endDate"
            type="datetime-local"
            disabled={isSubmitting}
            aria-invalid={!!errors.endDate}
            aria-describedby={errors.endDate ? 'endDate-error' : undefined}
            {...register('endDate', {
              setValueAs: (v: string) => (v ? new Date(v).toISOString() : v),
            })}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.endDate ? 'border-brand-error' : 'border-brand-border'}`}
          />
          {errors.endDate && (
            <p id="endDate-error" className="text-xs text-brand-error">
              {errors.endDate.message as string}
            </p>
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
          disabled={isSubmitting}
          aria-invalid={!!errors.totalSlots}
          aria-describedby={errors.totalSlots ? 'totalSlots-error' : undefined}
          {...register('totalSlots', { valueAsNumber: true })}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.totalSlots ? 'border-brand-error' : 'border-brand-border'}`}
        />
        {errors.totalSlots && (
          <p id="totalSlots-error" className="text-xs text-brand-error">
            {errors.totalSlots.message}
          </p>
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
                className="cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
                aria-label="Remove skill"
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
            disabled={isSubmitting}
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
          <Button type="button" variant="outline" onClick={addSkill} disabled={isSubmitting}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {errors.skills && (
          <p className="text-xs text-brand-error">{errors.skills.message as string}</p>
        )}
      </div>

      <LocationSelect
        value={watch('locationId') ?? ''}
        onChange={(v) => setValue('locationId', v)}
      />

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
          className={`w-10 h-6 rounded-full motion-safe:transition-colors motion-safe:duration-200 relative ${isRemote ? 'bg-brand-primary' : 'bg-brand-border'} focus-visible:ring-2 focus-visible:ring-brand-primary`}
          onClick={() => setValue('isRemote', !isRemote)}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow motion-safe:transition-transform motion-safe:duration-200 ${isRemote ? 'translate-x-5' : 'translate-x-1'}`}
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

const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  district: z.string().nullable(),
  state: z.string().nullable(),
});
const LocationArraySchema = z.array(LocationSchema);

function LocationSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['locations'],
    queryFn: () =>
      api.get('/locations').then((r) => LocationArraySchema.parse(r.data.data)),
    staleTime: 300_000,
  });

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newState, setNewState] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  if (isError) {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-brand-text">Location</p>
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>Failed to load locations</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm font-medium underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    const parsed = CreateLocationSchema.safeParse({
      name: newName.trim(),
      district: newDistrict.trim() || undefined,
      state: newState.trim() || undefined,
    });
    if (!parsed.success) {
      setCreateError(parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await api.post('/locations', parsed.data);
      const loc = LocationSchema.parse(res.data.data);
      onChange(loc.id);
      setNewName('');
      setNewDistrict('');
      setNewState('');
      setShowNewForm(false);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    } catch (err: unknown) {
      Sentry.captureException(err);
      const msg =
        (err as { normalizedMessage?: string })?.normalizedMessage ??
        (err as Error)?.message ??
        'Failed to create location';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  if (showNewForm) {
    return (
      <div className="space-y-2">
        {createError && (
          <div className="rounded-xl bg-brand-error/10 border border-brand-error/20 px-3 py-2 text-xs text-brand-error">
            {createError}
          </div>
        )}
        <label htmlFor="new-location-name" className="text-sm font-medium text-brand-text">
          New Location
        </label>
        <input
          id="new-location-name"
          type="text"
          placeholder="Location name *"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-background"
        />
        <input
          type="text"
          placeholder="District (optional)"
          value={newDistrict}
          onChange={(e) => setNewDistrict(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-background"
        />
        <input
          type="text"
          placeholder="State (optional)"
          value={newState}
          onChange={(e) => setNewState(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-background"
        />
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={() => setShowNewForm(false)} disabled={creating}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} loading={creating}>
            Add & Select
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor="locationId" className="text-sm font-medium text-brand-text">
        Location
      </label>
      <select
        id="locationId"
        value={value}
        onChange={(e) => {
          if (e.target.value === '__new__') {
            setShowNewForm(true);
            return;
          }
          onChange(e.target.value);
        }}
        className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-background"
      >
        <option value="">Select location (optional)</option>
        {isLoading && <option disabled>Loading locations...</option>}
        {(data ?? []).map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
            {loc.district ? `, ${loc.district}` : ''}
            {loc.state ? `, ${loc.state}` : ''}
          </option>
        ))}
        <option value="__new__" className="text-brand-primary font-medium">
          + Add new location...
        </option>
      </select>
    </div>
  );
}

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Sentry from '@sentry/nextjs';
import { useMemo } from 'react';
import { Button } from '../ui/Button';
import { EventSeriesFormSchema, type EventSeriesFormData } from '@/lib/shared';
import { cn } from '@/lib/utils';

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;

export interface EventSeriesOutput {
  title: string;
  description?: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  daysOfWeek?: number[];
  interval: number;
  startTime: string;
  endTime: string;
  venue?: string;
  isVirtual: boolean;
  meetingLink?: string;
  capacity: number;
  maxOccurrences?: number;
  endDate?: string;
  firstEventDate?: string;
}

interface EventSeriesFormProps {
  defaultValues?: Partial<EventSeriesFormData>;
  onSubmit: (data: EventSeriesOutput) => Promise<void>;
  submitLabel?: string;
}

function calculatePreviewDates(
  data: Partial<EventSeriesFormData> & {
    frequency: EventSeriesFormData['frequency'];
    daysOfWeek: EventSeriesFormData['daysOfWeek'];
    interval: EventSeriesFormData['interval'];
    firstEventDate?: string;
    endType: EventSeriesFormData['endType'];
    maxOccurrences?: number;
    endDate?: string;
  }
): string[] {
  const dates: string[] = [];
  const start = data.firstEventDate ? new Date(data.firstEventDate) : new Date();
  const dayOfMonth = start.getDate();

  for (let i = 0; i < 5; i++) {
    let next: Date;
    switch (data.frequency) {
      case 'DAILY': {
        next = new Date(start);
        next.setDate(next.getDate() + i * data.interval);
        break;
      }
      case 'WEEKLY': {
        if (data.daysOfWeek.length === 0) return dates;
        const sortedDays = [...data.daysOfWeek].sort((a, b) => a - b);
        const weekOffset = Math.floor(i / sortedDays.length) * data.interval;
        const targetDay = sortedDays[i % sortedDays.length];
        next = new Date(start);
        next.setDate(next.getDate() + weekOffset * 7);
        const currentDay = next.getDay();
        const diff = targetDay - currentDay;
        next.setDate(next.getDate() + (diff >= 0 ? diff : diff + 7));
        break;
      }
      case 'MONTHLY': {
        next = new Date(start);
        next.setMonth(next.getMonth() + i * data.interval);
        const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(dayOfMonth, lastDay));
        break;
      }
      default:
        next = new Date(start);
        next.setDate(next.getDate() + i * data.interval);
    }

    if (
      (data.endType === 'after' && i >= (data.maxOccurrences ?? Infinity)) ||
      (data.endType === 'on_date' && data.endDate && next > new Date(data.endDate))
    ) {
      break;
    }

    dates.push(
      next.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
  }

  return dates;
}

export function EventSeriesForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Create Series',
}: EventSeriesFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EventSeriesFormData>({
    resolver: zodResolver(EventSeriesFormSchema),
    defaultValues: {
      frequency: 'WEEKLY',
      interval: 1,
      isVirtual: false,
      endType: 'never',
      daysOfWeek: [],
      capacity: 30,
      ...defaultValues,
    },
  });

  const frequency = watch('frequency');
  const isVirtual = watch('isVirtual');
  const endType = watch('endType');
  const daysOfWeek = watch('daysOfWeek');
  const interval = watch('interval');
  const firstEventDate = watch('firstEventDate');
  const maxOccurrences = watch('maxOccurrences');
  const endDate = watch('endDate');

  const previewDates = useMemo(
    () =>
      calculatePreviewDates({
        frequency,
        daysOfWeek,
        interval,
        firstEventDate,
        endType,
        maxOccurrences,
        endDate,
      }),
    [frequency, daysOfWeek, interval, firstEventDate, endType, maxOccurrences, endDate],
  );

  const toggleDay = (day: number) => {
    const current = daysOfWeek ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    setValue('daysOfWeek', next, { shouldValidate: true });
  };

  const field = (
    id: keyof EventSeriesFormData,
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
        disabled={extra?.disabled ?? isSubmitting}
        className={cn(
          'w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60',
          errors[id] ? 'border-brand-error' : 'border-brand-border'
        )}
      />
      {errors[id] && <p className="text-xs text-brand-error">{errors[id]?.message as string}</p>}
    </div>
  );

  const handleFormSubmit = async (data: EventSeriesFormData) => {
    try {
      const toISO = (date: string, time: string) => new Date(`${date}T${time}`).toISOString();
      const formattedData: EventSeriesOutput = {
        ...data,
        firstEventDate: data.firstEventDate ? toISO(data.firstEventDate, data.startTime) : undefined,
        endDate: data.endDate ? toISO(data.endDate, data.startTime) : undefined,
      };
      await onSubmit(formattedData);
    } catch (err) {
      Sentry.captureException(err);
      setError('root', { message: 'Something went wrong.' });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {field('title', 'Series title', {
        placeholder: 'e.g. Weekly Community Clean-up',
        disabled: isSubmitting,
      })}

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium text-brand-text">
          Description (optional)
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          disabled={isSubmitting}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none disabled:opacity-60 ${
            errors.description ? 'border-brand-error' : 'border-brand-border'
          }`}
        />
        {errors.description && (
          <p id="description-error" className="text-xs text-brand-error">
            {errors.description.message as string}
          </p>
        )}
      </div>

      {/* Frequency */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-brand-text">Frequency</p>
        <div role="group" aria-labelledby="series-frequency-label" className="flex gap-2">
          <span id="series-frequency-label" className="sr-only">
            Frequency
          </span>
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setValue('frequency', f.value, { shouldValidate: true })}
              disabled={isSubmitting}
              aria-pressed={frequency === f.value}
              className={cn(
                'px-4 py-3 rounded-xl text-sm font-medium motion-safe:transition-colors cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none disabled:opacity-60',
                frequency === f.value
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-bg text-brand-muted hover:text-brand-text border border-brand-border'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Days of week (for WEEKLY) */}
      {frequency === 'WEEKLY' && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-brand-text">Repeat on</p>
          <div role="group" aria-labelledby="series-days-label" className="flex gap-1.5 flex-wrap">
            <span id="series-days-label" className="sr-only">
              Repeat on
            </span>
            {DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                disabled={isSubmitting}
                aria-pressed={daysOfWeek?.includes(day.value)}
                className={cn(
                  'w-11 h-11 rounded-xl text-xs font-medium motion-safe:transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none disabled:opacity-60',
                  daysOfWeek?.includes(day.value)
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-bg text-brand-muted hover:text-brand-text border border-brand-border'
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
          {errors.daysOfWeek && (
            <p className="text-xs text-brand-error">{errors.daysOfWeek.message as string}</p>
          )}
        </div>
      )}

      {/* Interval */}
      <div className="space-y-1.5">
        <label htmlFor="series-interval" className="text-sm font-medium text-brand-text">
          Every{' '}
          {frequency === 'DAILY'
            ? 'day(s)'
            : frequency === 'WEEKLY'
              ? 'week(s)'
              : frequency === 'MONTHLY'
                ? 'month(s)'
                : 'occurrence(s)'}
        </label>
        <input
          id="series-interval"
          type="number"
          min={1}
          {...register('interval', { valueAsNumber: true })}
          disabled={isSubmitting}
          aria-invalid={!!errors.interval}
          aria-describedby={errors.interval ? 'series-interval-error' : undefined}
          className={cn(
            'w-24 px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60',
            errors.interval ? 'border-brand-error' : 'border-brand-border'
          )}
        />
        {errors.interval && (
          <p id="series-interval-error" className="text-xs text-brand-error">
            {errors.interval.message as string}
          </p>
        )}
      </div>

      {/* First event date */}
      <div className="space-y-1.5">
        <label htmlFor="firstEventDate" className="text-sm font-medium text-brand-text">
          First event date
        </label>
        <input
          id="firstEventDate"
          type="date"
          {...register('firstEventDate')}
          disabled={isSubmitting}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60 ${
            errors.firstEventDate ? 'border-brand-error' : 'border-brand-border'
          }`}
        />
        {errors.firstEventDate && (
          <p className="text-xs text-brand-error">{errors.firstEventDate.message as string}</p>
        )}
      </div>

      {/* Time */}
      <div className="grid grid-cols-2 gap-4">
        {field('startTime', 'Start time', { type: 'time', disabled: isSubmitting })}
        {field('endTime', 'End time', { type: 'time', disabled: isSubmitting })}
      </div>

      {/* Capacity */}
      <div className="space-y-1.5">
        <label htmlFor="capacity" className="text-sm font-medium text-brand-text">
          Capacity per event
        </label>
        <input
          id="capacity"
          type="number"
          min={1}
          {...register('capacity', { valueAsNumber: true })}
          disabled={isSubmitting}
          aria-invalid={!!errors.capacity}
          aria-describedby={errors.capacity ? 'capacity-error' : undefined}
          className={cn(
            'w-24 px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60',
            errors.capacity ? 'border-brand-error' : 'border-brand-border'
          )}
        />
        {errors.capacity && (
          <p id="capacity-error" className="text-xs text-brand-error">
            {errors.capacity.message as string}
          </p>
        )}
      </div>

      {/* Virtual toggle */}
      <label htmlFor="series-virtual-toggle" className="flex items-center gap-3 cursor-pointer">
        <div
          id="series-virtual-toggle"
          role="switch"
          aria-checked={isVirtual}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setValue('isVirtual', !isVirtual);
            }
          }}
          className={`w-10 h-6 rounded-full motion-safe:transition-colors motion-safe:duration-200 relative ${
            isVirtual ? 'bg-brand-primary' : 'bg-brand-border'
          } ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}
          onClick={() => setValue('isVirtual', !isVirtual)}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow motion-safe:transition-transform motion-safe:duration-200 ${
              isVirtual ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </div>
        <span className="text-sm font-medium text-brand-text">Virtual event</span>
      </label>

      {isVirtual
        ? field('meetingLink', 'Meeting link', {
            type: 'url',
            placeholder: 'https://meet.google.com/...',
            disabled: isSubmitting,
          })
        : field('venue', 'Venue (optional)', {
            placeholder: 'e.g. Community Hall, Mumbai',
            disabled: isSubmitting,
          })}

      {/* End condition */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-brand-text">End condition</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="never"
              {...register('endType')}
              className="text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm text-brand-text">Never</span>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}>
            <input
              type="radio"
              value="after"
              {...register('endType')}
              disabled={isSubmitting}
              className="text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm text-brand-text">After</span>
            {endType === 'after' && (
              <input
                type="number"
                min={1}
                placeholder="events"
                {...register('maxOccurrences', { valueAsNumber: true })}
                disabled={isSubmitting}
                className="w-20 px-2 py-1 rounded-lg border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60"
              />
            )}
            <span className="text-sm text-brand-muted">events</span>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}>
            <input
              type="radio"
              value="on_date"
              {...register('endType')}
              disabled={isSubmitting}
              className="text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm text-brand-text">On date</span>
            {endType === 'on_date' && (
              <input
                type="date"
                {...register('endDate')}
                disabled={isSubmitting}
                className="px-2 py-1 rounded-lg border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60"
              />
            )}
          </label>
        </div>
      </div>

      {/* Preview */}
      {previewDates.length > 0 && (
        <div className="bg-brand-bg rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
            Preview — next {previewDates.length} occurrences
          </p>
          <ul className="space-y-1">
            {previewDates.map((d) => (
              <li key={d} className="text-sm text-brand-text flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {errors.root && <p className="text-xs text-brand-error text-center">{errors.root.message}</p>}
      <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}

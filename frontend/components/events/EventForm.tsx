'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { type EventInput, EventSchema } from '@/lib/shared';
import { Repeat } from 'lucide-react';
import { Button } from '../ui/Button';
import { EventSeriesForm, type EventSeriesOutput } from './EventSeriesForm';

interface EventFormProps {
  defaultValues?: Partial<EventInput>;
  onSubmit: (data: EventInput | EventSeriesOutput) => Promise<void>;
  submitLabel?: string;
  showRecurringOption?: boolean;
}

export function EventForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
  showRecurringOption = false,
}: EventFormProps) {
  const [isRecurring, setIsRecurring] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventInput>({
    resolver: zodResolver(EventSchema),
    defaultValues: { isVirtual: false, ...defaultValues },
  });

  const isVirtual = watch('isVirtual');

  const field = (
    id: keyof EventInput,
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

  if (isRecurring) {
    return (
      <div className="space-y-5">
        <label htmlFor="recurring-toggle-active" className="flex items-center gap-3 cursor-pointer">
          <div
            id="recurring-toggle-active"
            role="switch"
            aria-checked={isRecurring}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsRecurring(false);
              }
            }}
            className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${isRecurring ? 'bg-brand-primary' : 'bg-brand-border'}`}
            onClick={() => setIsRecurring(false)}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow transition-transform duration-200 ${isRecurring ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </div>
          <span className="text-sm font-medium text-brand-text flex items-center gap-1.5">
            <Repeat className="w-4 h-4" /> Recurring event
          </span>
        </label>
        <EventSeriesForm
          onSubmit={onSubmit}
          submitLabel={submitLabel}
          defaultValues={{
            title: defaultValues?.title,
            description: defaultValues?.description,
            startTime: defaultValues?.startTime,
            endTime: defaultValues?.endTime,
            isVirtual: defaultValues?.isVirtual ?? false,
            venue: defaultValues?.venue,
            meetingLink: defaultValues?.meetingLink,
            capacity: defaultValues?.capacity ?? 30,
          }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {showRecurringOption && (
        <label htmlFor="recurring-toggle" className="flex items-center gap-3 cursor-pointer pb-2 border-b border-brand-border">
          <div
            id="recurring-toggle"
            role="switch"
            aria-checked={isRecurring}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsRecurring(true);
              }
            }}
            className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${isRecurring ? 'bg-brand-primary' : 'bg-brand-border'}`}
            onClick={() => setIsRecurring(true)}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow transition-transform duration-200 ${isRecurring ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </div>
          <span className="text-sm font-medium text-brand-text flex items-center gap-1.5">
            <Repeat className="w-4 h-4" /> Recurring event
          </span>
        </label>
      )}

      {field('title', 'Event title', { placeholder: 'e.g. Community Clean-up Day' })}

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium text-brand-text">
          Description (optional)
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none ${errors.description ? 'border-brand-error' : 'border-brand-border'}`}
        />
        {errors.description && (
          <p className="text-xs text-brand-error">{errors.description.message as string}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="eventDate" className="text-sm font-medium text-brand-text">
          Event date
        </label>
        <input
          id="eventDate"
          type="datetime-local"
          {...register('eventDate', {
            setValueAs: (v: string) => (v ? new Date(v).toISOString() : v),
          })}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.eventDate ? 'border-brand-error' : 'border-brand-border'}`}
        />
        {errors.eventDate && (
          <p className="text-xs text-brand-error">{errors.eventDate.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field('startTime', 'Start time', { type: 'time' })}
        {field('endTime', 'End time', { type: 'time' })}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="capacity" className="text-sm font-medium text-brand-text">
          Capacity
        </label>
        <input
          id="capacity"
          type="number"
          min="1"
          placeholder="30"
          {...register('capacity', { valueAsNumber: true })}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.capacity ? 'border-brand-error' : 'border-brand-border'}`}
        />
        {errors.capacity && <p className="text-xs text-brand-error">{errors.capacity.message}</p>}
      </div>

      {/* Virtual toggle */}
      <label htmlFor="virtual-toggle" className="flex items-center gap-3 cursor-pointer">
        <div
          id="virtual-toggle"
          role="switch"
          aria-checked={isVirtual}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setValue('isVirtual', !isVirtual);
            }
          }}
          className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${isVirtual ? 'bg-brand-primary' : 'bg-brand-border'}`}
          onClick={() => setValue('isVirtual', !isVirtual)}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow transition-transform duration-200 ${isVirtual ? 'translate-x-5' : 'translate-x-1'}`}
          />
        </div>
        <span className="text-sm font-medium text-brand-text">Virtual event</span>
      </label>

      {isVirtual
        ? field('meetingLink', 'Meeting link', {
            type: 'url',
            placeholder: 'https://meet.google.com/...',
          })
        : field('venue', 'Venue (optional)', { placeholder: 'e.g. Community Hall, Mumbai' })}

      <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}

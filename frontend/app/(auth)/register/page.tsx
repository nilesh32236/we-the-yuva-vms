'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowLeft, ArrowRight, Calendar, Mail, Phone, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type RegisterInput, RegisterSchema } from '@/lib/shared';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '../../../components/shared/SkeletonCard';
import { useToast } from '../../../hooks/use-toast';
import { api } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { ROLE_ROUTES } from '../../../lib/shared/permissions';

type AvailabilityPref = 'anytime' | 'specific_days' | 'custom';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CallAvailabilityInput({
  value,
  onChange,
  error,
}: {
  value:
    | {
        preference: AvailabilityPref;
        days?: number[];
        startTime?: string;
        endTime?: string;
        slots?: Array<{ day: number; startTime: string; endTime: string }>;
      }
    | undefined;
  onChange: (val: typeof value) => void;
  error?: string;
}) {
  const pref = value?.preference ?? 'anytime';

  const setPref = (p: AvailabilityPref) => {
    onChange({ preference: p });
  };

  const toggleDay = (day: number) => {
    const current = value?.days ?? [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    onChange({ ...value, preference: 'specific_days' as const, days: next });
  };

  const addSlot = () => {
    const slots = value?.slots ?? [];
    onChange({
      ...value,
      preference: 'custom' as const,
      slots: [...slots, { day: 0, startTime: '09:00', endTime: '12:00' }],
    });
  };

  const updateSlot = (index: number, field: string, val: string | number) => {
    const slots = [...(value?.slots ?? [])];
    slots[index] = { ...slots[index], [field]: val };
    onChange({ ...value, preference: 'custom' as const, slots });
  };

  const removeSlot = (index: number) => {
    const slots = (value?.slots ?? []).filter((_, i) => i !== index);
    onChange({ ...value, preference: 'custom' as const, slots });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'anytime' as const, label: 'Anytime' },
          { value: 'specific_days' as const, label: 'Specific days' },
          { value: 'custom' as const, label: 'Custom schedule' },
        ].map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPref(opt.value)}
            className={`px-3 py-1.5 text-xs rounded-full cursor-pointer ${
              pref === opt.value
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-background text-brand-muted border-brand-border hover:border-brand-primary'
            }`}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {pref === 'specific_days' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((label, i) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="icon"
                onClick={() => toggleDay(i)}
                className={`w-10 h-10 text-xs rounded-full cursor-pointer ${
                  (value?.days ?? []).includes(i)
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-background text-brand-muted border-brand-border hover:border-brand-primary'
                }`}
                aria-pressed={(value?.days ?? []).includes(i)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="specific-days-start" className="text-xs text-brand-muted">From</label>
            <input
              id="specific-days-start"
              type="time"
              value={value?.startTime ?? ''}
              onChange={(e) =>
                onChange({ ...value, preference: 'specific_days' as const, startTime: e.target.value })
              }
              className="w-28 px-2 py-1.5 rounded-lg border border-brand-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <label htmlFor="specific-days-end" className="text-xs text-brand-muted">to</label>
            <input
              id="specific-days-end"
              type="time"
              value={value?.endTime ?? ''}
              onChange={(e) =>
                onChange({ ...value, preference: 'specific_days' as const, endTime: e.target.value })
              }
              className="w-28 px-2 py-1.5 rounded-lg border border-brand-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>
      )}

      {pref === 'custom' && (
        <div className="space-y-2">
          {(value?.slots ?? []).length === 0 && (
            <p className="text-xs text-brand-muted">No time slots added yet.</p>
          )}
          {(value?.slots ?? []).map((slot, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: slots have no stable ID; index is the correct key here
            <div key={`slot-${i}`} className="flex items-center gap-2 flex-wrap">
              <select
                value={slot.day}
                onChange={(e) => updateSlot(i, 'day', Number(e.target.value))}
                className="px-2 py-1.5 rounded-lg border border-brand-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {DAY_LABELS.map((label) => (
                  <option key={label} value={DAY_LABELS.indexOf(label)}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                className="w-28 px-2 py-1.5 rounded-lg border border-brand-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <span className="text-xs text-brand-muted">to</span>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateSlot(i, 'endTime', e.target.value)}
                className="w-28 px-2 py-1.5 rounded-lg border border-brand-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <Button
                type="button"
                variant="ghost" size="icon" onClick={() => removeSlot(i)}
                className="text-brand-error hover:text-brand-error/80 cursor-pointer"
                aria-label="Remove time slot"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSlot}
            className="text-xs text-brand-primary hover:underline cursor-pointer"
          >
            + Add time slot
          </button>
        </div>
      )}

      {error && (
        <p className="text-brand-error text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [whyVoluntaryCount, setWhyVoluntaryCount] = useState(0);

  // Redirect to dashboard or onboarding if already authenticated
  useEffect(() => {
    if (!isAuthLoading) {
      if (user) {
        if (!user.consent) {
          router.replace('/consent');
        } else {
          const route = ROLE_ROUTES[user.role] ?? '/login';
          router.replace(route);
        }
      } else {
        sessionStorage.removeItem('logged_out');
        // Check for access_token cookie using proper boundary matching
        const hasAccessCookie = /(?:^|;)\s*access_token\s*=/.test(document.cookie);
        if (hasAccessCookie) {
          // biome-ignore lint/suspicious/noDocumentCookie: clearing stale cookie
          document.cookie = 'access_token=; path=/; max-age=0; SameSite=Strict';
        }
        setReady(true);
      }
    }
  }, [user, isAuthLoading, router]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { role: 'VOLUNTEER' },
  });

  const watchWhyVoluntary = watch('whyVoluntary');

  useEffect(() => {
    setWhyVoluntaryCount(watchWhyVoluntary?.length ?? 0);
  }, [watchWhyVoluntary]);

  const onSubmit = async (data: RegisterInput) => {
    setFormError(null);
    try {
      await api.post('/auth/register', data);
      toast({
        title: 'Account created!',
        description: 'Check your email for the verification code.',
      });
      const otpRes = await api.post('/auth/send-otp', { email: data.email });
      if (otpRes.data?.devOtp) sessionStorage.setItem('devOtp', otpRes.data.devOtp);
      sessionStorage.setItem('verifyEmail', data.email);
      router.push('/verify-otp');
    } catch (error) {
      const err = error as {
        normalizedMessage?: string;
        response?: { status?: number; data?: { error?: string } };
      };
      const status = err?.response?.status;
      if (status === 409) {
        setFormError('This email is already registered. Please log in instead.');
        toast({
          title: 'Email already registered',
          description: 'Please log in instead.',
          variant: 'destructive',
        });
      } else {
        const message =
          err?.normalizedMessage ??
          err?.response?.data?.error ??
          'Something went wrong. Please try again.';
        setFormError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    }
  };

  if (!ready) return <SkeletonCard />;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer py-2 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to login
      </Link>

      {/* Register card */}
      <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 space-y-5">
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-text">Create your account</h1>
          <p className="text-brand-muted text-sm mt-1">
            Join thousands of volunteers making a difference
          </p>
        </div>

        {/* Inline API error banner */}
        {formError && (
          <div
            className="flex items-start gap-2 bg-brand-error/10 border border-brand-error/30 rounded-lg p-3 text-sm text-brand-error"
            role="alert"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="flex-1">{formError}</p>
            <Button
              type="button"
              variant="ghost" size="icon" onClick={() => setFormError(null)}
              className="text-brand-error hover:text-brand-error/80 cursor-pointer shrink-0"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Name field */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-brand-text">
              Full name <span className="text-brand-error">*</span>
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted"
                aria-hidden="true"
              />
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                disabled={isSubmitting}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors duration-200 bg-background
                  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                  ${errors.name ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p id="name-error" className="text-brand-error text-xs" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-brand-text">
              Email address <span className="text-brand-error">*</span>
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted"
                aria-hidden="true"
              />
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors duration-200 bg-background
                  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                  ${errors.email ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-brand-error text-xs" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone field */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-brand-text">
              Phone number <span className="text-brand-error">*</span>
            </label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted"
                aria-hidden="true"
              />
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                disabled={isSubmitting}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors duration-200 bg-background
                  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                  ${errors.phone ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
                {...register('phone')}
              />
            </div>
            {errors.phone && (
              <p id="phone-error" className="text-brand-error text-xs" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Date of Birth field */}
          <div className="space-y-1.5">
            <label htmlFor="dateOfBirth" className="text-sm font-medium text-brand-text">
              Date of birth <span className="text-brand-error">*</span>
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted"
                aria-hidden="true"
              />
              <input
                id="dateOfBirth"
                type="date"
                autoComplete="bday"
                disabled={isSubmitting}
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? 'dob-error' : undefined}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors duration-200 bg-background
                  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                  ${errors.dateOfBirth ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
                {...register('dateOfBirth')}
              />
            </div>
            {errors.dateOfBirth && (
              <p id="dob-error" className="text-brand-error text-xs" role="alert">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          {/* Address fields */}
          <fieldset className="space-y-3 border border-brand-border rounded-lg p-4">
            <legend className="text-sm font-medium text-brand-text px-1">
              Address <span className="text-brand-error">*</span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="address.city" className="text-xs text-brand-muted">
                  City <span className="text-brand-error">*</span>
                </label>
                <input
                  id="address.city"
                  type="text"
                  placeholder="Mumbai"
                  aria-describedby={errors.address?.city ? 'city-error' : undefined}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors duration-200 bg-background
                    focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                    ${errors.address?.city ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
                  {...register('address.city')}
                />
                {errors.address?.city && (
                  <p id="city-error" className="text-brand-error text-xs" role="alert">
                    {errors.address.city.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="address.state" className="text-xs text-brand-muted">
                  State <span className="text-brand-error">*</span>
                </label>
                <input
                  id="address.state"
                  type="text"
                  placeholder="Maharashtra"
                  aria-describedby={errors.address?.state ? 'state-error' : undefined}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors duration-200 bg-background
                    focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                    ${errors.address?.state ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
                  {...register('address.state')}
                />
                {errors.address?.state && (
                  <p id="state-error" className="text-brand-error text-xs" role="alert">
                    {errors.address.state.message}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          {/* Reference field */}
          <div className="space-y-1.5">
            <label htmlFor="reference" className="text-sm font-medium text-brand-text">
              Referred by (optional)
            </label>
            <input
              id="reference"
              type="text"
              placeholder="Phone number or referral code of the person who referred you"
              aria-describedby={errors.reference ? 'reference-error' : undefined}
              className={`w-full px-3 py-2.5 rounded-lg border transition-colors duration-200 bg-background
                    focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                    ${errors.reference ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
              {...register('reference')}
            />
            {errors.reference && (
              <p id="reference-error" className="text-brand-error text-xs" role="alert">
                {errors.reference.message}
              </p>
            )}
          </div>

          {/* Call Availability field */}
          <fieldset className="space-y-3 border border-brand-border rounded-lg p-4">
            <legend className="text-sm font-medium text-brand-text px-1">
              Call availability (optional)
            </legend>
            <p className="text-xs text-brand-muted">
              When is a good time to reach you for a quick call?
            </p>
            <CallAvailabilityInput
              value={watch('callAvailability')}
              onChange={(val) => setValue('callAvailability', val, { shouldValidate: true })}
            />
          </fieldset>

          {/* Why Voluntary field */}
          <div className="space-y-1.5">
            <label htmlFor="whyVoluntary" className="text-sm font-medium text-brand-text">
              Why do you want to do voluntary work? (optional)
            </label>
            <textarea
              id="whyVoluntary"
              rows={3}
              maxLength={500}
              placeholder="Share what motivates you to volunteer..."
              aria-describedby={errors.whyVoluntary ? 'why-voluntary-error' : 'why-voluntary-count'}
              className={`w-full px-3 py-2.5 rounded-lg border transition-colors duration-200 bg-background resize-none
                focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                ${errors.whyVoluntary ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
              {...register('whyVoluntary', {
                onChange: (e) => setWhyVoluntaryCount(e.target.value.length),
              })}
            />
            <div className="flex justify-between items-center">
              {errors.whyVoluntary ? (
                <p id="why-voluntary-error" className="text-brand-error text-xs" role="alert">
                  {errors.whyVoluntary.message}
                </p>
              ) : (
                <span />
              )}
              <p
                id="why-voluntary-count"
                className={`text-xs ${whyVoluntaryCount > 500 ? 'text-brand-error' : 'text-brand-muted'}`}
              >
                {whyVoluntaryCount}/500
              </p>
            </div>
          </div>

          <input type="hidden" {...register('role')} />

          <Button type="submit" variant="cta" fullWidth loading={isSubmitting}>
            Create Account
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </form>

        <p className="text-center text-sm text-brand-muted">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-brand-primary font-medium hover:underline cursor-pointer"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowLeft, ArrowRight, Calendar, Mail, Phone, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { GENDERS, type RegisterInput, RegisterSchema } from '@/lib/shared';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '../../../components/shared/SkeletonCard';
import { useToast } from '../../../hooks/use-toast';
import { api } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { ROLE_ROUTES } from '../../../lib/shared/permissions';

const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  FEMALE: 'Female',
  MALE: 'Male',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};
const GENDER_OPTIONS = GENDERS.map((value) => ({ value, label: GENDER_LABELS[value] }));

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
        setReady(true);
      }
    }
  }, [user, isAuthLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { role: 'VOLUNTEER' },
  });

  const onSubmit = async (data: RegisterInput) => {
    setFormError(null);
    try {
      await api.post('/auth/register', data);
      toast({
        title: 'Account created!',
        description: 'Check your email for the verification code.',
      });
      const otpRes = await api.post('/auth/send-otp', { email: data.email });
      if (otpRes.data?.devOtp && process.env.NEXT_PUBLIC_DEV_OTP === 'true') sessionStorage.setItem('devOtp', otpRes.data.devOtp);
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
              variant="ghost"
              size="icon"
              onClick={() => setFormError(null)}
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

          {/* WhatsApp Number field */}
          <div className="space-y-1.5">
            <label htmlFor="whatsappNumber" className="text-sm font-medium text-brand-text">
              WhatsApp number <span className="text-brand-error">*</span>
            </label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted"
                aria-hidden="true"
              />
              <input
                id="whatsappNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                disabled={isSubmitting}
                aria-invalid={!!errors.whatsappNumber}
                aria-describedby={errors.whatsappNumber ? 'whatsappNumber-error' : undefined}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors duration-200 bg-background
                  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                  ${errors.whatsappNumber ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
                {...register('whatsappNumber')}
              />
            </div>
            {errors.whatsappNumber && (
              <p id="whatsappNumber-error" className="text-brand-error text-xs" role="alert">
                {errors.whatsappNumber.message}
              </p>
            )}
          </div>

          {/* Gender field */}
          <div className="space-y-1.5">
            <label htmlFor="gender" className="text-sm font-medium text-brand-text">
              Gender <span className="text-brand-error">*</span>
            </label>
            <select
              id="gender"
              disabled={isSubmitting}
              aria-invalid={!!errors.gender}
              aria-describedby={errors.gender ? 'gender-error' : undefined}
              className={`w-full px-4 py-2.5 rounded-lg border transition-colors duration-200 bg-background
                focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                ${errors.gender ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
              {...register('gender')}
            >
              <option value="">Select…</option>
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {errors.gender && (
              <p id="gender-error" className="text-brand-error text-xs" role="alert">
                {errors.gender.message}
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

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Building2, Mail, User, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type RegisterInput, RegisterSchema, VOLUNTEER_TYPES } from '@/lib/shared';
import { Button } from '../../../components/ui/Button';
import { SkeletonCard } from '../../../components/shared/SkeletonCard';
import { useToast } from '../../../hooks/use-toast';
import { api, setAccessToken } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';

const ROLE_ROUTES: Record<string, string> = {
  VOLUNTEER: '/volunteer/dashboard',
  COORDINATOR: '/coordinator/dashboard',
  ADMIN: '/admin/dashboard',
  OBSERVER: '/observer/dashboard',
  ORGANIZATION_ADMIN: '/organization/dashboard',
  PLATFORM_MANAGER: '/admin/dashboard',
};

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isAuthLoading) {
      if (user) {
        const route = ROLE_ROUTES[user.role] ?? '/login';
        router.push(route);
      } else {
        sessionStorage.removeItem('logged_out');
        // Only clear in-memory token if there's evidence of a stale session
        const hasAccessCookie = document.cookie.includes('access_token=');
        if (hasAccessCookie) setAccessToken(null);
        setReady(true);
      }
    }
  }, [user, isAuthLoading, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { role: 'VOLUNTEER' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      await api.post('/auth/register', data);
      toast({ title: 'Account created!', description: 'Check your email for the verification code.' });
      const otpRes = await api.post('/auth/send-otp', { email: data.email });
      if (otpRes.data?.devOtp) sessionStorage.setItem('devOtp', otpRes.data.devOtp);
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      const err = error as { normalizedMessage?: string; response?: { status?: number; data?: { error?: string } } };
      const status = err?.response?.status;
      if (status === 409) {
        toast({
          title: 'Email already registered',
          description: 'This email is already registered. Please log in.',
          variant: 'destructive',
        });
      } else {
        const message = err?.normalizedMessage ?? err?.response?.data?.error ?? 'Something went wrong. Please try again.';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) return <SkeletonCard />;

  return (
    <div className="space-y-6">

      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Name field */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-brand-text">
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                aria-describedby={errors.name ? 'name-error' : undefined}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 bg-background
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
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 bg-background
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

          {/* Role selector */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-brand-text">I want to join as</span>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedRole === 'VOLUNTEER'
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-brand-border hover:border-brand-muted'}`}
              >
                <input
                  type="radio"
                  value="VOLUNTEER"
                  className="sr-only"
                  {...register('role')}
                />
                <Users className="w-5 h-5 text-brand-primary" />
                <span className="text-sm font-medium text-brand-text">Volunteer</span>
                <span className="text-xs text-brand-muted text-center">
                  Find opportunities and track impact
                </span>
              </label>
              <label
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedRole === 'ORGANIZATION_ADMIN'
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-brand-border hover:border-brand-muted'}`}
              >
                <input
                  type="radio"
                  value="ORGANIZATION_ADMIN"
                  className="sr-only"
                  {...register('role')}
                />
                <Building2 className="w-5 h-5 text-brand-primary" />
                <span className="text-sm font-medium text-brand-text">Organization</span>
                <span className="text-xs text-brand-muted text-center">
                  Register and manage your organization
                </span>
              </label>
            </div>
          </div>

          {/* Volunteer type field */}
          {selectedRole === 'VOLUNTEER' && (
            <div className="space-y-1.5">
              <label htmlFor="volunteerType" className="text-sm font-medium text-brand-text">
                I want to volunteer as
              </label>
              <select
                id="volunteerType"
                aria-describedby={errors.volunteerType ? 'volunteerType-error' : undefined}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 bg-background
                  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                  ${errors.volunteerType ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
                {...register('volunteerType')}
              >
                <option value="">Select your volunteer type (optional)</option>
                {VOLUNTEER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              {errors.volunteerType && (
                <p id="volunteerType-error" className="text-brand-error text-xs" role="alert">
                  {errors.volunteerType.message}
                </p>
              )}
            </div>
          )}

          <Button type="submit" variant="cta" fullWidth loading={isLoading}>
            Create Account
            <ArrowRight className="w-4 h-4" />
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

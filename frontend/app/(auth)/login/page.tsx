'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type SendOtpInput, SendOtpSchema } from '@/lib/shared';
import { Button } from '../../../components/ui/Button';
import { SkeletonCard } from '../../../components/shared/SkeletonCard';
import { useToast } from '../../../hooks/use-toast';
import { api } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { ROLE_ROUTES } from '../../../lib/shared/permissions';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [ready, setReady] = useState(false);

  // Redirect to dashboard or onboarding if already authenticated
  useEffect(() => {
    if (!isAuthLoading) {
      if (user) {
        if (!user.consent) {
          router.replace('/consent');
        } else if (user.role === 'VOLUNTEER' && !user.profile) {
          router.replace('/setup-profile');
        } else if (
          ['COORDINATOR', 'ADMIN', 'OBSERVER', 'ORGANIZATION_ADMIN', 'PLATFORM_MANAGER'].includes(
            user.role
          ) &&
          !user.locationId
        ) {
          router.replace('/setup-profile');
        } else {
          const route = ROLE_ROUTES[user.role] ?? '/login';
          router.replace(route);
        }
      } else {
        setReady(true);
      }
    }
  }, [user, isAuthLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SendOtpInput>({
    resolver: zodResolver(SendOtpSchema),
  });

  const onSubmit = async (data: SendOtpInput) => {
    try {
      const res = await api.post('/auth/send-otp', data);
      // TEMPORARY: store dev OTP so verify page can display it
      if (res.data?.devOtp) {
        sessionStorage.setItem('devOtp', res.data.devOtp);
      }
      sessionStorage.setItem('verifyEmail', data.email);
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      const message =
        (error as { normalizedMessage?: string; response?: { data?: { error?: string } } })
          ?.normalizedMessage ??
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Something went wrong. Please try again.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  if (!ready) return <SkeletonCard />;

  return (
    <div className="space-y-6">
      {/* Hero image */}
      <div className="relative w-full h-48 rounded-2xl overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80"
          alt="Volunteers working together"
          fill
          sizes="(max-width: 768px) 100vw, 448px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-text/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white font-heading font-semibold text-lg leading-tight">
            Connecting volunteers with purpose
          </p>
        </div>
      </div>

      {/* Login card */}
      <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 space-y-5">
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-text">Welcome back</h1>
          <p className="text-brand-muted text-sm mt-1">Enter your email to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-brand-text">
              Email address
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
                  ${
                    errors.email
                      ? 'border-brand-error focus:ring-brand-error'
                      : 'border-brand-border'
                  }`}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-brand-error text-xs" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="cta"
            fullWidth
            loading={isSubmitting}
            className="active-bounce"
          >
            Continue
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </form>

        <p className="text-center text-sm text-brand-muted">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-brand-primary font-medium hover:underline cursor-pointer"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

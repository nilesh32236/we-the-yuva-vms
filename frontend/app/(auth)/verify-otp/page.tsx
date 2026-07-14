'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { OtpInput } from '../../../components/auth/OtpInput';
import { ResendButton } from '../../../components/auth/ResendButton';
import { SkeletonCard } from '../../../components/shared/SkeletonCard';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { VerifyOtpSchema } from '../../../lib/shared';
import type { VerifyOtpInput } from '../../../lib/shared';
import { ROLE_ROUTES } from '../../../lib/shared/permissions';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user: authUser, isLoading: isAuthLoading, refetch } = useAuth();

  const email = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('verifyEmail') : '') ?? searchParams.get('email') ?? '';
  const [isVerifying, setIsVerifying] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(300);
  const submitted = useRef(false);

  const {
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<VerifyOtpInput>({
    resolver: zodResolver(VerifyOtpSchema),
    defaultValues: { email, otp: '' },
  });

  // TEMPORARY: read dev OTP from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('devOtp');
    if (stored) {
      setDevOtp(stored);
      sessionStorage.removeItem('devOtp');
    }
  }, []);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // Redirect to login if no email provided (useEffect to avoid render-phase redirect with Suspense)
  const [redirected, setRedirected] = useState(false);
  useEffect(() => {
    if (!email && !redirected) {
      setRedirected(true);
      router.replace('/login');
    }
  }, [email, redirected, router]);

  // Single navigation effect — handles both initial mount (already authenticated)
  // and post-verify routing. Uses the FULL auth context user from /users/me
  // to avoid race condition with the verify handler.
  const [navHandled, setNavHandled] = useState(false);
  useEffect(() => {
    if (isAuthLoading || navHandled) return;

    if (authUser) {
      setNavHandled(true);
      if (!authUser.consent) {
        router.replace('/consent');
      } else {
        router.replace(ROLE_ROUTES[authUser.role] ?? '/login');
      }
    }
  }, [authUser, isAuthLoading, navHandled, router]);

  const handleVerify = useCallback(
    async (digits: string[]) => {
      const code = digits.join('');
      // Guard against double-submission (strict mode, concurrent renders)
      if (submitted.current) return;
      submitted.current = true;

      setIsVerifying(true);
      try {
        const response = await api.post('/auth/verify-otp', { email, otp: code });
        if (!response.data?.accessToken || !response.data?.user) {
          throw new Error('Invalid server response');
        }
        const { accessToken } = response.data;

        // Clear any stale logged_out flag from previous session
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('logged_out');
          sessionStorage.removeItem('verifyEmail');
        }

        // Store in cookie for immediate API calls
        if (accessToken) {
          if (typeof document !== 'undefined') {
            const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
            // biome-ignore lint/suspicious/noDocumentCookie: required for Edge middleware access
            document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; max-age=900; SameSite=Strict${secureFlag}`;
          }
        }

        // Populate auth context via refetch — the navigation effect above
        // will route based on the FULL user from /users/me
        await refetch();
      } catch (error) {
        const message =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Invalid or expired code. Please try again.';
        toast({ title: 'Verification failed', description: message, variant: 'destructive' });
        submitted.current = false;
        setValue('otp', '', { shouldValidate: true });
      } finally {
        setIsVerifying(false);
      }
    },
    [email, refetch, toast, setValue]
  );

  const otpValue = watch('otp');

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otpValue.length === 6 && !isVerifying && !navHandled) {
      trigger('otp').then((valid) => {
        if (valid) handleVerify(otpValue.split(''));
      });
    }
  }, [otpValue, isVerifying, handleVerify, navHandled, trigger]);

  const handleResend = async () => {
    try {
      const res = await api.post('/auth/send-otp', { email });
      if (res.data?.devOtp) {
        sessionStorage.setItem('devOtp', res.data.devOtp);
        setDevOtp(res.data.devOtp);
      }
      setCountdown(300);
      toast({ title: 'Code sent', description: `A new code has been sent to ${email}` });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not resend code. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if ((!email && redirected) || authUser) return null;

  return (
    <div className="space-y-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6 text-brand-primary" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-brand-text">Verify your email</h1>
          <p className="text-brand-muted text-sm">We sent a 6-digit code to</p>
          <p className="font-medium text-brand-text text-sm">{email}</p>
        </div>

        {process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEV_OTP && devOtp && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
            <p className="text-yellow-900 dark:text-yellow-100 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 inline-block -mt-0.5" aria-hidden="true" /> Dev OTP
            </p>
            <p className="text-yellow-900 dark:text-yellow-100 text-2xl font-mono font-bold tracking-widest mt-1">
              {devOtp}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Controller
            name="otp"
            control={control}
            render={({ field }) => (
              <OtpInput
                value={field.value ? field.value.split('') : Array(6).fill('')}
                onChange={(digits) => {
                  field.onChange(digits.join(''));
                  submitted.current = false;
                }}
                disabled={isVerifying}
                error={!!errors.otp}
              />
            )}
          />
          {errors.otp && (
            <p className="text-brand-error text-xs text-center" role="alert">
              {errors.otp.message}
            </p>
          )}

          {isVerifying && (
            <div
              className="flex items-center justify-center gap-2 text-brand-muted text-sm"
              role="status"
            >
              <span className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
              Verifying...
            </div>
          )}
        </div>

        {countdown > 0 ? (
          <div className="text-center">
            <p className="text-brand-muted text-xs">
              Code expires in{' '}
              <span
                className={
                  countdown < 60 ? 'text-brand-error font-medium' : 'font-medium text-brand-text'
                }
              >
                {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
              </span>
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-brand-error text-xs font-medium">
              Code expired. Please request a new one.
            </p>
          </div>
        )}

        <div className="text-center space-y-1">
          <p className="text-brand-muted text-sm">Didn&apos;t receive it?</p>
          <ResendButton onResend={handleResend} />
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto p-6">
          <SkeletonCard />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}

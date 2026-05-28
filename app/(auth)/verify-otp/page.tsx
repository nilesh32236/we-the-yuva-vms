'use client';

import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { OtpInput } from '../../../components/auth/OtpInput';
import { ResendButton } from '../../../components/auth/ResendButton';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/useAuth';
import { api, setAccessToken } from '../../../lib/api';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { setUser } = useAuth();

  const email = searchParams.get('email') ?? '';
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const submitted = useRef(false);

  const handleVerify = useCallback(
    async (digits: string[]) => {
      const code = digits.join('');
      if (code.length !== 6) return;
      // Guard against double-submission (strict mode, concurrent renders)
      if (submitted.current) return;
      submitted.current = true;

      setIsVerifying(true);
      try {
        const response = await api.post('/auth/verify-otp', { email, otp: code });
        const { user, accessToken } = response.data;

        // Store in memory for immediate API calls (cross-domain Bearer)
        if (accessToken) setAccessToken(accessToken);

        // Set cookie client-side so Next.js Edge middleware can read it for routing
        if (accessToken && typeof document !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; max-age=900; SameSite=Strict${secure}`;
        }

        // Populate auth context directly — no extra /users/me round-trip needed
        setUser(user);

        // Navigate based on onboarding state
        if (!user.consent) {
          router.push('/consent');
        } else if (
          (user.role === 'VOLUNTEER' && !user.profile) ||
          (['COORDINATOR', 'ADMIN', 'OBSERVER'].includes(user.role) && !user.locationId)
        ) {
          router.push('/setup-profile');
        } else {
          const roleRoutes: Record<string, string> = {
            VOLUNTEER: '/volunteer/dashboard',
            COORDINATOR: '/coordinator/dashboard',
            ADMIN: '/admin/dashboard',
            OBSERVER: '/observer/dashboard',
          };
          router.push(roleRoutes[user.role] ?? '/login');
        }
      } catch (error) {
        const message =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Invalid or expired code. Please try again.';
        toast({ title: 'Verification failed', description: message, variant: 'destructive' });
        submitted.current = false;
        setOtp(Array(6).fill(''));
      } finally {
        setIsVerifying(false);
      }
    },
    [email, router, setUser, toast]
  );

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.every((d) => d !== '') && !isVerifying) {
      handleVerify(otp);
    }
  }, [otp, isVerifying, handleVerify]);

  const handleResend = async () => {
    await api.post('/auth/send-otp', { email });
    toast({ title: 'Code sent', description: `A new code has been sent to ${email}` });
  };

  if (!email) {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6 text-brand-primary" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-brand-text">Verify your email</h1>
          <p className="text-brand-muted text-sm">We sent a 6-digit code to</p>
          <p className="font-medium text-brand-text text-sm">{email}</p>
        </div>

        <div className="space-y-4">
          <OtpInput value={otp} onChange={setOtp} disabled={isVerifying} />

          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-brand-muted text-sm">
              <span className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
              Verifying...
            </div>
          )}
        </div>

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
    <Suspense fallback={<div className="text-center text-brand-muted">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}

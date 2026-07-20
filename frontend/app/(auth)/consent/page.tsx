'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Camera, Check, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ConsentSchema } from '@/lib/shared';
import type { ConsentInput } from '@/lib/shared';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { ROLE_ROUTES } from '../../../lib/shared/permissions';

const PRIVACY_POLICY_TEXT = `
WeTheYuva Volunteer Management System — Privacy Policy

Last updated: May 2026

1. Information We Collect
We collect information you provide during registration including your name, email address, skills, interests, and availability. We also collect participation data including events attended, hours contributed, and feedback.

2. How We Use Your Information
Your information is used to match you with relevant volunteer opportunities, track your impact and contributions, send notifications about events and opportunities, and generate anonymised reports for our organisation.

3. Data Sharing
We do not sell your personal data. Your information may be shared with coordinators managing events you participate in, and with our partner organisations for the purpose of coordinating volunteer activities.

4. Data Retention
We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.

5. Your Rights
You have the right to access, correct, or delete your personal data. You may also opt out of non-essential communications at any time through your notification preferences.

6. Contact
For privacy-related queries, contact us at privacy@wetheyuva.org
`.trim();

export default function ConsentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, refetch } = useAuth();
  const policyRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (policyRef.current) {
      policyRef.current.tabIndex = 0;
    }
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConsentInput>({
    resolver: zodResolver(ConsentSchema),
    defaultValues: {
      privacyPolicyAccepted: false,
      mediaConsentAccepted: false,
    },
  });

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  const onSubmit = async (data: ConsentInput) => {
    try {
      await api.post('/auth/consent', {
        privacyPolicyAccepted: true,
        mediaConsentAccepted: data.mediaConsentAccepted,
      });
      const freshUser = await refetch();
      router.push(ROLE_ROUTES[freshUser?.role ?? ''] ?? '/login');
    } catch (error) {
      const axiosError = error as {
        response?: { status?: number; data?: { error?: string; message?: string } };
      };
      const status = axiosError?.response?.status;
      if (status === 409) {
        // Already consented — move on
        const freshUser = await refetch();
        router.push(ROLE_ROUTES[freshUser?.role ?? ''] ?? '/login');
      } else {
        const message =
          axiosError?.response?.data?.error ??
          axiosError?.response?.data?.message ??
          'Could not save your consent. Please try again.';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 space-y-5"
      >
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-text">Before you begin</h1>
          <p className="text-brand-muted text-sm mt-1">Please review and accept our policies</p>
        </div>

        {/* Privacy policy scroll box */}
        <section
          ref={policyRef}
          className="h-48 overflow-y-auto rounded-xl border border-brand-border bg-brand-bg p-4 text-xs text-brand-muted leading-relaxed"
          aria-label="Privacy policy text"
        >
          <pre className="whitespace-pre-wrap font-body">{PRIVACY_POLICY_TEXT}</pre>
        </section>

        {/* Checkboxes */}
        <div className="space-y-3">
          {/* Privacy policy — required */}
          <Controller
            name="privacyPolicyAccepted"
            control={control}
            render={({ field }) => (
              <label className="flex items-start gap-3 cursor-pointer group has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-primary rounded-lg">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={field.value as unknown as boolean}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="sr-only"
                    aria-describedby="privacy-desc"
                    aria-invalid={!!errors.privacyPolicyAccepted}
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200
                      ${
                        field.value
                          ? 'bg-brand-primary border-brand-primary'
                          : errors.privacyPolicyAccepted
                            ? 'border-brand-error group-hover:border-brand-primary'
                            : 'border-brand-border group-hover:border-brand-primary'
                      }`}
                  >
                    {field.value && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm font-medium text-brand-text">
                      I have read and accept the Privacy Policy
                    </span>
                    <span className="text-brand-error text-xs font-medium">(required)</span>
                  </div>
                  <p id="privacy-desc" className="text-xs text-brand-muted mt-0.5">
                    Required to use the WeTheYuva platform
                  </p>
                  {errors.privacyPolicyAccepted && (
                    <p className="text-brand-error text-xs mt-1" role="alert">
                      {errors.privacyPolicyAccepted.message}
                    </p>
                  )}
                </div>
              </label>
            )}
          />

          {/* Media consent — optional */}
          <Controller
            name="mediaConsentAccepted"
            control={control}
            render={({ field }) => (
              <label className="flex items-start gap-3 cursor-pointer group has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-primary rounded-lg">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="sr-only"
                    aria-describedby="media-desc"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200
                      ${
                        field.value
                          ? 'bg-brand-primary border-brand-primary'
                          : 'border-brand-border group-hover:border-brand-primary'
                      }`}
                  >
                    {field.value && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-brand-muted" />
                    <span className="text-sm font-medium text-brand-text">
                      I consent to media usage
                    </span>
                    <span className="text-brand-muted text-xs">(optional)</span>
                  </div>
                  <p id="media-desc" className="text-xs text-brand-muted mt-0.5">
                    Allow WeTheYuva to use photos/videos from events you participate in
                  </p>
                </div>
              </label>
            )}
          />
        </div>

        <Button
          type="submit"
          variant="cta"
          fullWidth
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

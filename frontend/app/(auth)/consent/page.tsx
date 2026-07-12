'use client';

import { ArrowRight, Camera, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';

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
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [mediaAccepted, setMediaAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  const handleSubmit = async () => {
    if (!privacyAccepted) return;

    setIsLoading(true);
    try {
      await api.post('/auth/consent', {
        privacyPolicyAccepted: true,
        mediaConsentAccepted: mediaAccepted,
      });
      router.push('/setup-profile');
    } catch (error) {
      const axiosError = error as {
        response?: { status?: number; data?: { error?: string; message?: string } };
      };
      const status = axiosError?.response?.status;
      if (status === 409) {
        // Already consented — move on
        router.push('/setup-profile');
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 space-y-5">
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-text">Before you begin</h1>
          <p className="text-brand-muted text-sm mt-1">Please review and accept our policies</p>
        </div>

        {/* Privacy policy scroll box */}
        <section
          className="h-48 overflow-y-auto rounded-xl border border-brand-border bg-brand-bg p-4 text-xs text-brand-muted leading-relaxed"
          aria-label="Privacy policy text"
        >
          <pre className="whitespace-pre-wrap font-body">{PRIVACY_POLICY_TEXT}</pre>
        </section>

        {/* Checkboxes */}
        <div className="space-y-3">
          {/* Privacy policy — required */}
          <label className="flex items-start gap-3 cursor-pointer group has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-primary rounded-lg">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="sr-only"
                aria-describedby="privacy-desc"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200
                  ${
                    privacyAccepted
                      ? 'bg-brand-primary border-brand-primary'
                      : 'border-brand-border group-hover:border-brand-primary'
                  }`}
              >
                {privacyAccepted && (
                  <svg
                    aria-hidden="true"
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
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
            </div>
          </label>

          {/* Media consent — optional */}
          <label className="flex items-start gap-3 cursor-pointer group has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-primary rounded-lg">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={mediaAccepted}
                onChange={(e) => setMediaAccepted(e.target.checked)}
                className="sr-only"
                aria-describedby="media-desc"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200
                  ${
                    mediaAccepted
                      ? 'bg-brand-primary border-brand-primary'
                      : 'border-brand-border group-hover:border-brand-primary'
                  }`}
              >
                {mediaAccepted && (
                  <svg
                    aria-hidden="true"
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
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
        </div>

        <Button
          variant="cta"
          fullWidth
          onClick={handleSubmit}
          disabled={!privacyAccepted}
          loading={isLoading}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

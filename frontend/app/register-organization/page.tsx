'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Building2, Check, ChevronLeft, FileText, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type RegisterOrganizationInput, RegisterOrganizationSchema } from '@/lib/shared';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface DocItem {
  file: File;
  type: 'REGISTRATION_CERTIFICATE' | 'GOVT_ID' | 'OTHER';
  fileName: string;
  fileUrl: string;
  uploading: boolean;
  error?: string;
}

const STEPS = ['Organization Info', 'Documents', 'Review & Submit'];

export default function RegisterOrganizationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState<DocItem[]>([]);

  useEffect(() => {
    if (!isAuthLoading && user?.role !== 'ORGANIZATION_ADMIN') {
      if (!user) router.push('/login');
      else router.push('/');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (user?.organizationId) {
      router.push('/organization/dashboard');
    }
  }, [user, router]);

  const defaultValues: RegisterOrganizationInput = {
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterOrganizationInput>({
    resolver: zodResolver(RegisterOrganizationSchema),
    defaultValues,
  });

  const watchedName = watch('name');

  const addDoc = (type: DocItem['type']) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const doc: DocItem = { file, type, fileName: file.name, fileUrl: '', uploading: true };
      setDocs((prev) => [...prev, doc]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setDocs((prev) =>
          prev.map((d) =>
            d === doc
              ? { ...d, fileUrl: res.data.url, fileName: res.data.filename, uploading: false }
              : d
          )
        );
      } catch {
        setDocs((prev) =>
          prev.map((d) =>
            d === doc ? { ...d, uploading: false, error: 'Upload failed. Click to retry.' } : d
          )
        );
      }
    };
    input.click();
  };

  const removeDoc = (index: number) => {
    setDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceedToReview = () => {
    const hasCert = docs.some(
      (d) => d.type === 'REGISTRATION_CERTIFICATE' && !d.uploading && d.fileUrl
    );
    const hasGovtId = docs.some((d) => d.type === 'GOVT_ID' && !d.uploading && d.fileUrl);
    return hasCert && hasGovtId;
  };

  const onSubmit = async (data: RegisterOrganizationInput) => {
    try {
      const orgRes = await api.post('/organizations/register', data);
      const orgId = orgRes.data.id;

      for (const doc of docs) {
        await api.post(`/organizations/${orgId}/documents`, {
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          type: doc.type,
        });
      }

      toast({
        title: 'Organization registered',
        description: 'Your application is pending review.',
      });
      reset();
      router.push('/organization/dashboard');
    } catch (error) {
      const err = error as {
        normalizedMessage?: string;
        response?: { status?: number; data?: { error?: string } };
      };
      const message =
        err?.normalizedMessage ??
        err?.response?.data?.error ??
        'Registration failed. Please try again.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  if (isAuthLoading || !user || user.role !== 'ORGANIZATION_ADMIN') return null;

  return (
    <main id="main" className="min-h-screen bg-brand-bg py-8 sm:py-12" aria-busy={isSubmitting}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          href="/organization/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="font-heading font-bold text-2xl text-brand-text">
            Register Your Organization
          </h1>
          <p className="text-brand-muted text-sm mt-1">
            Set up your organization profile to start managing volunteers and opportunities.
          </p>
        </div>

        {/* biome-ignore lint/a11y/useSemanticElements: flex layout prevents using ul/li; ARIA roles added per audit requirement */}
        <div className="flex items-center justify-center gap-2 mb-10" role="list">
          {STEPS.map((label, i) => (
            /* biome-ignore lint/a11y/useSemanticElements: flex layout prevents using ul/li; ARIA roles added per audit requirement */
            <div key={label} className="flex items-center gap-2" role="listitem">
              <div
                role="status"
                aria-current={i === step ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${label}`}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors
                  ${i < step ? 'bg-brand-primary text-white' : ''}
                  ${i === step ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20' : ''}
                  ${i > step ? 'bg-brand-border text-brand-muted' : ''}`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-sm hidden sm:inline ${i <= step ? 'text-brand-text font-medium' : 'text-brand-muted'}`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 ${i < step ? 'bg-brand-primary' : 'bg-brand-border'}`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>

        {step === 0 && (
          <form
            onSubmit={handleSubmit(
              () => setStep(1),
              () =>
                toast({
                  title: 'Validation Error',
                  description: 'Please fix the highlighted fields before proceeding.',
                  variant: 'destructive',
                })
            )}
            className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 sm:p-8 space-y-5"
          >
            <div>
              <h2 className="font-heading font-semibold text-lg text-brand-text">
                Organization Information
              </h2>
              <p className="text-brand-muted text-sm mt-1">Tell us about your organization.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-brand-text">
                Organization name *
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Yuva Foundation"
                disabled={isSubmitting}
                aria-describedby={errors.name ? 'name-error' : undefined}
                aria-invalid={!!errors.name}
                className={`w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 ${errors.name ? 'border-brand-error' : 'border-brand-border'}`}
                {...register('name')}
              />
              {errors.name && (
                <p id="name-error" className="text-xs text-brand-error" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium text-brand-text">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Brief description of your organization's mission and work"
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border resize-none disabled:opacity-50"
                {...register('description')}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className="text-sm font-medium text-brand-text">
                Address
              </label>
              <textarea
                id="address"
                rows={2}
                placeholder="Street, city, state, pincode"
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border resize-none disabled:opacity-50"
                {...register('address')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-brand-text">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border disabled:opacity-50"
                  {...register('phone')}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-brand-text">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="org@example.com"
                  disabled={isSubmitting}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                  className="w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border disabled:opacity-50"
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-brand-error" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="website" className="text-sm font-medium text-brand-text">
                Website
              </label>
              <input
                id="website"
                type="url"
                placeholder="https://example.org"
                disabled={isSubmitting}
                aria-describedby={errors.website ? 'website-error' : undefined}
                aria-invalid={!!errors.website}
                className="w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border disabled:opacity-50"
                {...register('website')}
              />
              {errors.website && (
                <p id="website-error" className="text-xs text-brand-error" role="alert">
                  {errors.website.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Next: Documents
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-semibold text-lg text-brand-text">
                Verification Documents
              </h2>
              <p className="text-brand-muted text-sm mt-1">
                Upload your organization&apos;s registration certificate and government ID for
                verification.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-brand-text">
                Registration Certificate *
              </span>
              <div aria-live="polite" className="sr-only">
                {docs.filter((d) => d.uploading).length > 0 ? 'Uploading documents...' : ''}
                {docs.filter((d) => d.error).length > 0 ? 'Upload failed for some documents.' : ''}
              </div>
              {((): React.ReactNode => {
                const d = docs.find((d) => d.type === 'REGISTRATION_CERTIFICATE');
                if (!d) {
                  return (
                    <button
                      type="button"
                      onClick={() => addDoc('REGISTRATION_CERTIFICATE')}
                      className="w-full p-6 rounded-xl border-2 border-dashed border-brand-border hover:border-brand-primary hover:bg-brand-bg/50 transition-colors text-center cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      <Upload className="w-6 h-6 mx-auto text-brand-muted mb-2" />
                      <p className="text-sm text-brand-muted">Click to upload (PDF, PNG, JPG)</p>
                    </button>
                  );
                }
                return (
                  <div
                    className={`flex items-center justify-between p-3 rounded-xl bg-brand-bg border ${d.error ? 'border-brand-error' : 'border-brand-border'}`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-primary" />
                      <div>
                        <span className="text-sm text-brand-text">{d.fileName}</span>
                        {d.error && <p className="text-xs text-brand-error">{d.error}</p>}
                      </div>
                      {d.uploading && <Loader2 className="w-4 h-4 animate-spin text-brand-muted" />}
                    </div>
                    <button
                      type="button"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-xs text-brand-error hover:underline cursor-pointer"
                      onClick={() => removeDoc(docs.findIndex((x) => x.type === 'REGISTRATION_CERTIFICATE'))}
                    >
                      Remove
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-brand-text">Government ID *</span>
              {((): React.ReactNode => {
                const d = docs.find((d) => d.type === 'GOVT_ID');
                if (!d) {
                  return (
                    <button
                      type="button"
                      onClick={() => addDoc('GOVT_ID')}
                      className="w-full p-6 rounded-xl border-2 border-dashed border-brand-border hover:border-brand-primary hover:bg-brand-bg/50 transition-colors text-center cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      <Upload className="w-6 h-6 mx-auto text-brand-muted mb-2" />
                      <p className="text-sm text-brand-muted">Click to upload (PDF, PNG, JPG)</p>
                    </button>
                  );
                }
                return (
                  <div
                    className={`flex items-center justify-between p-3 rounded-xl bg-brand-bg border ${d.error ? 'border-brand-error' : 'border-brand-border'}`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-primary" />
                      <div>
                        <span className="text-sm text-brand-text">{d.fileName}</span>
                        {d.error && <p className="text-xs text-brand-error">{d.error}</p>}
                      </div>
                      {d.uploading && <Loader2 className="w-4 h-4 animate-spin text-brand-muted" />}
                    </div>
                    <button
                      type="button"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-xs text-brand-error hover:underline cursor-pointer"
                      onClick={() => removeDoc(docs.findIndex((x) => x.type === 'GOVT_ID'))}
                    >
                      Remove
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-brand-text">Other Document (optional)</span>
              {((): React.ReactNode => {
                const d = docs.find((d) => d.type === 'OTHER');
                if (!d) {
                  return (
                    <button
                      type="button"
                      onClick={() => addDoc('OTHER')}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-brand-border hover:border-brand-border/80 hover:bg-brand-bg/50 transition-colors text-center cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      <span className="text-sm text-brand-muted">+ Add optional document</span>
                    </button>
                  );
                }
                return (
                  <div
                    className={`flex items-center justify-between p-3 rounded-xl bg-brand-bg border ${d.error ? 'border-brand-error' : 'border-brand-border'}`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-primary" />
                      <div>
                        <span className="text-sm text-brand-text">{d.fileName}</span>
                        {d.error && <p className="text-xs text-brand-error">{d.error}</p>}
                      </div>
                      {d.uploading && <Loader2 className="w-4 h-4 animate-spin text-brand-muted" />}
                    </div>
                    <button
                      type="button"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-xs text-brand-error hover:underline cursor-pointer"
                      onClick={() => removeDoc(docs.findIndex((x) => x.type === 'OTHER'))}
                    >
                      Remove
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!canProceedToReview()}
                onClick={() => setStep(2)}
              >
                Next: Review
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 sm:p-8 space-y-6"
          >
            <div>
              <h2 className="font-heading font-semibold text-lg text-brand-text">
                Review & Submit
              </h2>
              <p className="text-brand-muted text-sm mt-1">
                Please verify your information before submitting.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-brand-bg border border-brand-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-brand-text">
                  <Building2 className="w-4 h-4 inline mr-1.5 text-brand-primary" />
                  {watchedName || 'Organization'}
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="text-xs text-brand-primary hover:underline min-h-[44px] min-w-[44px] p-2 flex items-center justify-center"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-brand-bg border border-brand-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-brand-text">
                  <FileText className="w-4 h-4 inline mr-1.5 text-brand-primary" />
                  Documents ({docs.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-brand-primary hover:underline min-h-[44px] min-w-[44px] p-2 flex items-center justify-center"
                >
                  Edit
                </button>
              </div>
              {docs.map((d) => (
                <div key={d.fileName} className="flex items-center gap-2 text-sm text-brand-text">
                  <Check className="w-3.5 h-3.5 text-brand-primary" />
                  {d.fileName}
                  <span className="text-xs text-brand-muted ml-auto">
                    {d.type.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

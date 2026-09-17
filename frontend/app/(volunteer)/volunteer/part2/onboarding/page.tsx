'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, FileText, Heart, Languages, Briefcase, MapPin, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Part2Schema } from '@/lib/shared/schemas/part2.schemas';
import type { Part2Data } from '@/lib/shared/schemas/part2.schemas';
import { SkeletonCard } from '../../../../../components/shared/SkeletonCard';
import { Button } from '../../../../../components/ui/Button';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';
import { useMyChallenge } from '../../../../../lib/kindness';
import { Step1Reflection } from '../../../../../components/onboarding-part2/Step1Reflection';
import { Step2Roles } from '../../../../../components/onboarding-part2/Step2Roles';
import { Step3SkillsLanguages } from '../../../../../components/onboarding-part2/Step3SkillsLanguages';
import { Step4CommitmentSupport } from '../../../../../components/onboarding-part2/Step4CommitmentSupport';
import { Step5Background } from '../../../../../components/onboarding-part2/Step5Background';
import { Step6EmergencyConsent } from '../../../../../components/onboarding-part2/Step6EmergencyConsent';

const DRAFT_KEY = 'part2-draft';

const STEPS = [
  { icon: FileText, label: 'Reflection' },
  { icon: Briefcase, label: 'Roles' },
  { icon: Languages, label: 'Skills & Languages' },
  { icon: Heart, label: 'Commitment' },
  { icon: MapPin, label: 'Background' },
  { icon: Shield, label: 'Emergency & Consent' },
] as const;

const STEP_FIELDS: string[][] = [
  ['kindnessReflection', 'aspirations'],
  ['roleMappings'],
  ['lifeSkills', 'lifeSkillsOther', 'languages'],
  ['volunteerRoleTier', 'preferredDays', 'preferredTimeSlots', 'supportResources'],
  ['preferredCityArea', 'maxTravelDistance', 'hasVolunteered', 'previousOrgName', 'previousRole', 'linkedinUrl', 'instagramUrl', 'twitterUrl', 'portfolioUrl'],
  ['emergencyContactName', 'emergencyRelationship', 'emergencyMobile', 'privacyPolicyConsent', 'codeOfConductConsent'],
];

const defaultValues: Part2Data = {
  kindnessReflection: '',
  aspirations: '',
  roleMappings: [
    'CAPACITY_BUILDER_TRAINER',
    'COMMUNITY_OUTREACH_SURVEY',
    'GRIEVANCE_SUPPORT_FACILITATOR',
    'SOLUTION_CAMP_COORDINATOR',
    'STAKEHOLDER_LIAISON',
    'WARD_AREA_AMBASSADOR',
    'PROGRAMME_DATA_SUPPORTER',
    'VOLUNTEER_ENGAGEMENT_SUPPORTER',
  ].map((role) => ({ role, skillsOffer: '', skillsDevelop: '' })) as never,
  lifeSkills: [],
  lifeSkillsOther: '',
  languages: [],
  volunteerRoleTier: '' as never,
  preferredDays: [],
  preferredTimeSlots: [],
  specificDaysTimes: '',
  supportResources: [],
  preferredCityArea: '',
  remoteAvailable: false,
  hasVolunteered: false,
  previousOrgName: '',
  previousRole: '',
  previousDurationNature: '',
  linkedinUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  portfolioUrl: '',
  emergencyContactName: '',
  emergencyRelationship: '',
  emergencyMobile: '',
  medicalConditions: '',
  privacyPolicyConsent: false as never,
  codeOfConductConsent: false as never,
  mediaConsent: false,
  whatsappConsent: false,
} as never;

export default function Part2OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: challengeData, isLoading: challengeLoading } = useMyChallenge();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [gatingChecked, setGatingChecked] = useState(false);

  const { register, watch, setValue, trigger, reset, formState: { errors, isDirty } } = useForm<Part2Data>({
    resolver: zodResolver(Part2Schema),
    defaultValues,
  });

  // Gating: check unlocked + load existing data
  useEffect(() => {
    if (challengeLoading) return;
    const unlocked = !!challengeData?.challenge.part2UnlockedAt;
    if (!unlocked) {
      router.push('/volunteer/part2');
      return;
    }
    // Fetch existing part2 data to prefill
    api.get('/users/me/onboarding/part2').then((res) => {
      if (res.data?.data) {
        reset(res.data.data);
      }
      setGatingChecked(true);
    }).catch(() => setGatingChecked(true));
  }, [challengeLoading, challengeData, router, reset]);

  // Draft localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = Part2Schema.safeParse(JSON.parse(saved));
        if (parsed.success) reset(parsed.data);
      }
    } catch { /* ignore */ }
  }, [reset]);

  useEffect(() => {
    const sub = watch((data) => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    });
    return () => sub.unsubscribe();
  }, [watch]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    if (isDirty) window.addEventListener('beforeunload', handler);
    else window.removeEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    try { sessionStorage.setItem('part2-step', String(step)); } catch { /* ignore */ }
  }, [step]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('part2-step');
      if (saved !== null) {
        const p = parseInt(saved, 10);
        if (!Number.isNaN(p) && p >= 0 && p < STEPS.length) setStep(p);
      }
    } catch { /* ignore */ }
  }, []);

  const goToStep = (s: number) => { setFormError(null); setStep(s); };
  const validateStep = async (idx: number) => {
    const fields = STEP_FIELDS[idx];
    if (fields.length === 0) return true;
    const results = await Promise.all(fields.map((f) => trigger(f as never)));
    const valid = results.every(Boolean);
    if (!valid) toast({ title: 'Please fix the highlighted fields', variant: 'destructive' });
    return valid;
  };
  const handleNext = async () => { if (await validateStep(step)) goToStep(step + 1); };
  const handleBack = () => goToStep(step - 1);

  const handleSubmit = async () => {
    for (let i = 0; i < STEPS.length; i++) {
      const ok = await validateStep(i);
      if (!ok) { goToStep(i); return; }
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      const data = watch();
      await api.put('/users/me/onboarding/part2', data);
      localStorage.removeItem(DRAFT_KEY);
      toast({ title: 'Part II submitted', description: 'Thank you for completing your onboarding!' });
      router.push('/volunteer/dashboard');
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not submit. Please try again.';
      setFormError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  if (challengeLoading || !gatingChecked) return <div className="py-8"><SkeletonCard /></div>;

  const progress = ((step + 1) / STEPS.length) * 100;
  const stepProps = { register, setValue, watch, errors };
  const stepComponents = [
    <Step1Reflection key={0} {...stepProps} />,
    <Step2Roles key={1} {...stepProps} />,
    <Step3SkillsLanguages key={2} {...stepProps} />,
    <Step4CommitmentSupport key={3} {...stepProps} />,
    <Step5Background key={4} {...stepProps} />,
    <Step6EmergencyConsent key={5} {...stepProps} />,
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      <div>
        <h1 className="font-heading font-bold text-2xl text-brand-text">Part II Onboarding</h1>
        <p className="text-brand-muted text-sm mt-1">Complete your volunteer profile — 6 steps</p>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-brand-muted"><span>Step {step + 1} of {STEPS.length}</span><span>{STEPS[step].label}</span></div>
        <div className="h-2 bg-brand-border rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-brand-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-2" role="tablist">
        {STEPS.map((s, i) => (
          <button key={s.label} type="button" role="tab" onClick={() => { if (i < step) goToStep(i); }} disabled={i > step} aria-selected={i === step}
            className={`flex items-center gap-1 px-3 py-2.5 min-h-11 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${i === step ? 'bg-brand-primary text-white' : i < step ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-border/30 text-brand-muted cursor-not-allowed'}`}>
            <s.icon className="w-3 h-3" />{s.label}
          </button>
        ))}
      </div>
      <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 space-y-5" aria-busy={isSubmitting}>
        <section aria-live="polite">{stepComponents[step]}</section>
        {formError && (
          <div className="flex items-start gap-2 bg-brand-error/10 border border-brand-error/30 rounded-lg p-3 text-sm text-brand-error" role="alert">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /><p className="flex-1">{formError}</p>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          {step > 0 && <Button variant="outline" className="flex-1" onClick={handleBack}><ArrowLeft className="w-4 h-4" /> Back</Button>}
          {step < STEPS.length - 1 ? (
            <Button variant="cta" className={step === 0 ? 'w-full' : 'flex-1'} onClick={handleNext}>Next <ArrowRight className="w-4 h-4" /></Button>
          ) : (
            <Button variant="primary" className="flex-1" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>Submit Part II <Check className="w-4 h-4" /></Button>
          )}
        </div>
      </div>
    </div>
  );
}

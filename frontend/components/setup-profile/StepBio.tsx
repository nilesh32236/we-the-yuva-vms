'use client';

import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import type { OnboardingData } from '@/lib/shared';

interface StepBioProps {
  register: UseFormRegister<OnboardingData>;
  setValue: UseFormSetValue<OnboardingData>;
  watch: UseFormWatch<OnboardingData>;
  errors: FieldErrors<OnboardingData>;
}

export function StepBio({ register, setValue, watch, errors }: StepBioProps) {
  const bio = watch('step5.bio') ?? '';
  const socialLinks = watch('step5.socialLinks');

  const socialLinkField = (
    label: string,
    field: 'linkedin' | 'instagram' | 'twitter' | 'facebook'
  ) => {
    const id = `social-${field}`;
    const val = socialLinks?.[field] ?? '';
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium text-brand-text">
          {label}
        </label>
        <input
          id={id}
          type="url"
          value={val}
          onChange={(e) =>
            setValue(
              'step5.socialLinks',
              { ...socialLinks, [field]: e.target.value },
              { shouldValidate: true }
            )
          }
          placeholder={`https://${field}.com/...`}
          className="w-full px-4 py-2.5 rounded-lg border border-brand-border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
      </div>
    );
  };

  return (
    <>
      <h2 className="font-heading font-semibold text-xl text-brand-text">Bio & Social</h2>
      <p className="text-brand-muted text-sm -mt-3">Introduce yourself to the community</p>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="bio" className="text-sm font-medium text-brand-text">
            Bio
          </label>
          <p className="text-xs text-brand-muted">
            Tell us a bit about yourself (max 300 characters)
          </p>
          <textarea
            id="bio"
            rows={4}
            maxLength={300}
            placeholder="Share your story, what drives you, and what you hope to achieve as a volunteer..."
            aria-describedby={errors.step5?.bio ? 'bio-error' : 'bio-count'}
            className={`w-full px-4 py-2.5 rounded-lg border text-base bg-background resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
              errors.step5?.bio
                ? 'border-brand-error focus:ring-brand-error'
                : 'border-brand-border'
            }`}
            {...register('step5.bio')}
          />
          <div className="flex justify-between items-center">
            {errors.step5?.bio ? (
              <p id="bio-error" className="text-brand-error text-xs" role="alert">
                {errors.step5.bio.message}
              </p>
            ) : (
              <span />
            )}
            <p
              id="bio-count"
              className={`text-xs ${bio.length > 300 ? 'text-brand-error' : 'text-brand-muted'}`}
            >
              {bio.length}/300
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="avatarUrl" className="text-sm font-medium text-brand-text">
            Profile Photo URL (Optional)
          </label>
          <input
            id="avatarUrl"
            type="url"
            placeholder="https://example.com/photo.jpg"
            className="w-full px-4 py-2.5 rounded-lg border border-brand-border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            {...register('step5.avatarUrl')}
          />
        </div>

        <div className="border border-brand-border rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-brand-text">Social Links (Optional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {socialLinkField('LinkedIn', 'linkedin')}
            {socialLinkField('Instagram', 'instagram')}
            {socialLinkField('Twitter / X', 'twitter')}
            {socialLinkField('Facebook', 'facebook')}
          </div>
        </div>
      </div>
    </>
  );
}

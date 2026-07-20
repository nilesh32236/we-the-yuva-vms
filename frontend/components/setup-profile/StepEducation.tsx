'use client';

import { useState } from 'react';
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import type { OnboardingData } from '@/lib/shared';

interface StepEducationProps {
  register: UseFormRegister<OnboardingData>;
  setValue: UseFormSetValue<OnboardingData>;
  watch: UseFormWatch<OnboardingData>;
  errors: FieldErrors<OnboardingData>;
}

export function StepEducation({ register, setValue, watch, errors }: StepEducationProps) {
  const certifications = watch('step4.certifications') ?? [];
  const [certInput, setCertInput] = useState('');

  const addCertification = () => {
    if (certInput.trim()) {
      setValue('step4.certifications', [...certifications, certInput.trim()], {
        shouldValidate: true,
      });
      setCertInput('');
    }
  };

  const field = (
    label: string,
    fieldName: 'education' | 'occupation' | 'experience',
    error?: string,
    opts?: { placeholder?: string; textarea?: boolean; rows?: number }
  ) => {
    const id = `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium text-brand-text">
          {label}
        </label>
        {opts?.textarea ? (
          <textarea
            id={id}
            rows={opts.rows ?? 3}
            placeholder={opts?.placeholder}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`w-full px-4 py-2.5 rounded-lg border text-base bg-background resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
              error ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'
            }`}
            {...register(`step4.${fieldName}`)}
          />
        ) : (
          <input
            id={id}
            type="text"
            placeholder={opts?.placeholder}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`w-full px-4 py-2.5 rounded-lg border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
              error ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'
            }`}
            {...register(`step4.${fieldName}`)}
          />
        )}
        {error && (
          <p id={`${id}-error`} className="text-brand-error text-xs" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <h2 className="font-heading font-semibold text-xl text-brand-text">Education & Experience</h2>
      <p className="text-brand-muted text-sm -mt-3">Tell us about your background</p>

      <div className="space-y-5">
        {field('Education *', 'education', errors.step4?.education?.message, {
          placeholder: 'e.g. B.Tech Computer Science',
        })}
        {field('Occupation *', 'occupation', errors.step4?.occupation?.message, {
          placeholder: 'e.g. Software Engineer, Student',
        })}
        {field('Experience *', 'experience', errors.step4?.experience?.message, {
          placeholder: 'Tell us about your relevant experience...',
          textarea: true,
          rows: 3,
        })}

        <div className="space-y-3">
          <span className="text-sm font-medium text-brand-text">Certifications (Optional)</span>
          <p className="text-xs text-brand-muted">Add any certifications you hold</p>

          {certifications.map((cert) => (
            <div key={cert} className="flex items-center gap-2 text-sm">
              <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full">
                {cert}
              </span>
              <button
                type="button"
                onClick={() => {
                  const idx = certifications.indexOf(cert);
                  setValue(
                    'step4.certifications',
                    certifications.filter((_, j) => j !== idx),
                    { shouldValidate: true }
                  );
                }}
                className="text-brand-muted hover:text-red-500 text-xs cursor-pointer px-3 py-2 min-h-11"
              >
                Remove
              </button>
            </div>
          ))}

          <label htmlFor="cert-input" className="sr-only">
            Certification
          </label>
          <div className="flex gap-2">
            <input
              id="cert-input"
              type="text"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCertification();
                }
              }}
              placeholder="Type a certification and press Enter or Add"
              className="flex-1 px-3 py-2.5 rounded-lg border border-brand-border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={addCertification}
              className="px-4 py-3 rounded-lg text-sm font-medium bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer min-h-[44px]"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

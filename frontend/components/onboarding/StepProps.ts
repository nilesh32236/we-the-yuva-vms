import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { OnboardingData } from '@/lib/shared';
import React from 'react';

export interface StepProps {
  register: UseFormRegister<OnboardingData>;
  setValue: UseFormSetValue<OnboardingData>;
  watch: UseFormWatch<OnboardingData>;
  errors: FieldErrors<OnboardingData>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return React.createElement('p', { className: 'text-brand-error text-xs', role: 'alert' }, message);
}

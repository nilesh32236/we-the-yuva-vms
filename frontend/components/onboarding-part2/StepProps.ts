import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { Part2Data } from '@/lib/shared/schemas/part2.schemas';
import React from 'react';

export interface StepProps {
  register: UseFormRegister<Part2Data>;
  setValue: UseFormSetValue<Part2Data>;
  watch: UseFormWatch<Part2Data>;
  errors: FieldErrors<Part2Data>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return React.createElement('p', { className: 'text-brand-error text-xs', role: 'alert' }, message);
}

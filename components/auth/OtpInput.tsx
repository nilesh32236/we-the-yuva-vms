'use client';

import { type ChangeEvent, type ClipboardEvent, type KeyboardEvent, useRef } from 'react';

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled = false }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const newValue = [...value];
    newValue[index] = digit;
    onChange(newValue);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input on backspace when current is empty
        const newValue = [...value];
        newValue[index - 1] = '';
        onChange(newValue);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newValue = [...value];
        newValue[index] = '';
        onChange(newValue);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newValue = Array(6).fill('');
      pasted.split('').forEach((char, i) => {
        newValue[i] = char;
      });
      onChange(newValue);
      // Focus the last filled input or the next empty one
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <fieldset
      aria-label="One-time password"
      className="flex items-center gap-2 justify-center border-0 p-0 m-0"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          // biome-ignore lint/suspicious/noArrayIndexKey: OTP digits are positional
          key={`otp-${index}`}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] ?? ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of 6`}
          className={`w-11 h-12 text-center text-xl font-bold rounded-lg border-2 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              value[index]
                ? 'border-brand-primary bg-brand-bg text-brand-text'
                : 'border-brand-border bg-brand-surface text-brand-text'
            }`}
        />
      ))}
    </fieldset>
  );
}

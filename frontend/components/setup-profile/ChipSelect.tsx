'use client';

import { Button } from '@/components/ui/Button';

interface ChipSelectProps<T extends string> {
  options: readonly T[];
  selected: readonly string[];
  toggle: (val: string) => void;
  labelMap?: Partial<Record<T, string>>;
  error?: string;
}

export function ChipSelect<T extends string>({
  options,
  selected,
  toggle,
  labelMap,
  error,
}: ChipSelectProps<T>) {
  return (
    <div className="space-y-2" aria-invalid={!!error || undefined}>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Button
            key={opt}
            variant={selected.includes(opt) ? 'primary' : 'outline'}
            onClick={() => toggle(opt)}
            aria-pressed={selected.includes(opt)}
            className="rounded-full min-h-11 hover:border-brand-primary transition-colors"
          >
            {labelMap?.[opt] ?? opt.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>
      {error && (
        <p className="text-brand-error text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

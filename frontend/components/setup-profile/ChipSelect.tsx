'use client';

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
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              selected.includes(opt)
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'border-brand-border text-brand-text hover:border-brand-primary'
            }`}
          >
            {labelMap?.[opt] ?? opt.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-brand-error text-xs" role="alert">{error}</p>
      )}
    </div>
  );
}

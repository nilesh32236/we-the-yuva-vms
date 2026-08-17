import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-secondary disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active-bounce',
  cta: 'bg-brand-cta text-white hover:bg-brand-cta/90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active-bounce',
  outline:
    'border border-brand-border text-brand-text hover:bg-brand-bg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
  ghost:
    'text-brand-primary hover:text-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  icon: 'p-2 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
  destructive:
    'bg-brand-error text-white hover:bg-brand-error/90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active-bounce',
  'outline-destructive':
    'border border-brand-error text-brand-error hover:bg-brand-error/5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active-bounce',
  link: 'text-sm font-semibold text-brand-primary hover:underline disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer px-4 py-2.5 min-h-[44px]',
  'ghost-destructive':
    'text-brand-muted hover:text-brand-error hover:bg-brand-error/10 dark:hover:bg-red-950/30 dark:hover:text-red-400 active-bounce disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors',
};

const spinnerColors: Record<string, string> = {
  primary: 'border-white/30 border-t-white',
  cta: 'border-white/30 border-t-white',
  outline: 'border-current/30 border-t-current',
  ghost: 'border-current/30 border-t-current',
  icon: 'border-current/30 border-t-current',
  destructive: 'border-white/30 border-t-white',
  'outline-destructive': 'border-current/30 border-t-current',
  'ghost-destructive': 'border-current/30 border-t-current',
  link: 'border-current/30 border-t-current',
};

const sizes = {
  sm: 'text-sm px-3 py-2 min-h-[44px]',
  md: 'text-sm px-4 py-3 min-h-[44px]',
  lg: 'text-base px-5 py-3 min-h-[44px]',
  icon: 'min-h-[44px] min-w-[44px]',
  compact: 'text-sm font-semibold px-4 py-2.5 min-h-[44px] rounded-xl active-bounce',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <span
          className={`w-4 h-4 border-2 rounded-full motion-safe:animate-spin ${spinnerColors[variant]}`}
        />
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = 'Button';

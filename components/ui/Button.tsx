import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

const variants = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-secondary disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
  cta: 'bg-brand-cta text-white hover:bg-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
  outline:
    'border border-brand-border text-brand-text hover:bg-brand-bg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
  ghost:
    'text-brand-primary hover:text-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  icon: 'p-2 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
};

const sizes = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-5 py-3',
  icon: '',
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
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-200',
        variants[variant],
        variant !== 'icon' && variant !== 'ghost' && sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = 'Button';

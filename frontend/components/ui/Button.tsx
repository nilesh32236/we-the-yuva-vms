import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

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
};

const sizes = {
  sm: 'text-sm px-3 py-2 min-h-[44px]',
  md: 'text-sm px-4 py-3 min-h-[44px]',
  lg: 'text-base px-5 py-3 min-h-[44px]',
  icon: 'min-h-[44px] min-w-[44px]',
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
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        variants[variant],
        variant !== 'icon' && variant !== 'ghost' && sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = 'Button';

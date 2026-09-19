import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

const buttonVariants = {
  base: 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  variants: {
    default: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
    destructive: 'bg-severity-critical text-white hover:bg-severity-critical-dark shadow-sm',
    outline: 'border border-border bg-background hover:bg-background-tertiary',
    secondary: 'bg-background-tertiary text-text-primary hover:bg-border',
    ghost: 'hover:bg-background-tertiary',
    link: 'text-primary underline-offset-4 hover:underline',
  },
  sizes: {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-9 rounded-md px-3 text-xs',
    lg: 'h-11 rounded-md px-8 text-base',
    xl: 'h-12 rounded-lg px-10 text-lg',
    icon: 'h-10 w-10',
  },
};

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  disabled,
  loading = false,
  children,
  ...props
}) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants.base, buttonVariants.variants[variant], buttonVariants.sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </Comp>
  );
}

Button.displayName = 'Button';

export { Button, buttonVariants };

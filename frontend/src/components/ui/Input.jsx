import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type = 'text', error, ...props }, ref) => (
  <div className="w-full">
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        error && 'border-severity-critical focus-visible:ring-severity-critical',
        className
      )}
      ref={ref}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.id}-error` : undefined}
      {...props}
    />
    {error && (
      <p id={`${props.id}-error`} className="mt-1.5 text-xs text-severity-critical" role="alert">
        {error}
      </p>
    )}
  </div>
));
Input.displayName = 'Input';

export { Input };
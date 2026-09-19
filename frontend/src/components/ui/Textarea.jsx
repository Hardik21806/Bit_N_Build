import * as React from 'react';
import { cn } from '../../lib/utils';

const Textarea = React.forwardRef(
  ({ className, error, ...props }, ref) => {
    const errorId = props.id
      ? `${props.id}-error`
      : undefined;

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            // Base
            'flex w-full',
            'min-h-[120px]',
            'resize-y',
            'rounded-lg',
            'border',
            'border-border',
            'bg-background',
            'px-3.5',
            'py-3',

            // Typography
            'text-sm',
            'leading-6',
            'text-text-primary',

            // Placeholder
            'placeholder:text-text-muted',

            // Interaction
            'transition-all',
            'duration-150',
            'outline-none',

            // Focus
            'focus:border-primary',
            'focus:ring-2',
            'focus:ring-primary/10',

            // Disabled
            'disabled:cursor-not-allowed',
            'disabled:opacity-50',
            'disabled:bg-background-tertiary',

            // Error
            error &&
              'border-severity-critical focus:border-severity-critical focus:ring-severity-critical/10',

            className
          )}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-xs font-medium text-severity-critical"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
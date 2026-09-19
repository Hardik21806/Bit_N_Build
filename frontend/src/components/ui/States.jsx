import * as React from 'react';
import { cn } from '../../lib/utils';
import { Loader2, AlertCircle, FileText, Search, Inbox, MapPin, RefreshCw } from 'lucide-react';

function LoadingSpinner({ size = 'md', className, ...props }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <svg
      className={cn('animate-spin text-primary', sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function LoadingOverlay({ className, message = 'Loading...' }) {
  return (
    <div className={cn('fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm', className)}>
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-text-muted">{message}</p>
    </div>
  );
}

function Skeleton({ className, variant = 'text', width, height, ...props }) {
  const baseStyles = 'animate-pulse rounded bg-background-tertiary';
  const variantStyles = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ width, height }}
      {...props}
    />
  );
}

function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="relative w-full overflow-auto scrollbar-thin">
      <table className="w-full caption-bottom text-sm">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="h-10 px-3 text-left align-middle font-medium text-text-muted uppercase tracking-wider">
                <Skeleton variant="text" width="60%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-3 py-2.5 align-middle">
                  <Skeleton variant="text" width="80%" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardSkeleton({ className }) {
  return (
    <div className={cn('rounded-lg border bg-background shadow-xs p-5', className)}>
      <Skeleton variant="text" width="40%" className="mb-4" />
      <Skeleton variant="text" width="60%" className="mb-2" />
      <Skeleton variant="text" width="80%" />
    </div>
  );
}

function EmptyState({ icon: Icon = Inbox, title = 'No data', description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-10 px-4 text-center', className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-background-tertiary text-text-muted">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-medium text-text-primary">{title}</h3>
      {description && <p className="mt-1 text-sm text-text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function ErrorState({ title = 'Something went wrong', description, onRetry, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-10 px-4 text-center', className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-severity-critical-light text-severity-critical">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="text-base font-medium text-text-primary">{title}</h3>
      {description && <p className="mt-1 text-sm text-text-muted max-w-sm">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-hover"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}

function PageLoading({ className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[300px]', className)}>
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-text-muted">Loading dashboard...</p>
    </div>
  );
}

export {
  LoadingSpinner,
  LoadingOverlay,
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  EmptyState,
  ErrorState,
  PageLoading,
};
import * as React from 'react';
import { cn } from '../../lib/utils';
import { getSeverityColor, getStatusColor, getResourceStatusColor, getAssignmentStatusColor, getAlertStatusColor } from '../../lib/design-tokens';

const badgeVariants = {
  base: 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
  variants: {
    default: 'bg-border text-text-primary',
    primary: 'bg-primary-light text-primary',
    secondary: 'bg-background-tertiary text-text-secondary',
    destructive: 'bg-severity-critical-light text-severity-critical-text',
    outline: 'border border-border bg-transparent',
  },
};

function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span className={cn(badgeVariants.base, badgeVariants.variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

function SeverityBadge({ severity, showIcon = false, ...props }) {
  const color = getSeverityColor(severity);
  const label = severity?.charAt(0).toUpperCase() + severity?.slice(1) || 'Unknown';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        `bg-[${color.light}] text-[${color.text}]`,
        props.className
      )}
      {...props}
    >
      {showIcon && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {label}
    </span>
  );
}

function StatusBadge({ status, type = 'incident', ...props }) {
  let color;
  let label = status?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';

  switch (type) {
    case 'incident':
      color = getStatusColor(status);
      break;
    case 'resource':
      color = getResourceStatusColor(status);
      break;
    case 'assignment':
      color = getAssignmentStatusColor(status);
      break;
    case 'alert':
      color = getAlertStatusColor(status);
      break;
    default:
      color = getStatusColor(status);
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        `bg-[${color.light}] text-[${color.text}]`,
        props.className
      )}
      {...props}
    >
      {label}
    </span>
  );
}

function ResourceTypeBadge({ type, ...props }) {
  const labels = {
    ambulance: 'Ambulance',
    fire_truck: 'Fire Truck',
    police_unit: 'Police Unit',
    rescue_team: 'Rescue Team',
    medical_team: 'Medical Team',
    helicopter: 'Helicopter',
    equipment: 'Equipment',
    facility: 'Facility',
  };

  return (
    <Badge variant="outline" className="gap-1" {...props}>
      <span className="relative flex h-1.5 w-1.5 rounded-full bg-primary" />
      {labels[type] || type}
    </Badge>
  );
}

Badge.displayName = 'Badge';
SeverityBadge.displayName = 'SeverityBadge';
StatusBadge.displayName = 'StatusBadge';
ResourceTypeBadge.displayName = 'ResourceTypeBadge';

export { Badge, SeverityBadge, StatusBadge, ResourceTypeBadge, badgeVariants };
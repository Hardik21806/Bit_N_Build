import * as React from 'react';
import * as AlertPrimitive from '@radix-ui/react-alert-dialog';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getSeverityColor, getAlertStatusColor } from '../../lib/design-tokens';

const Alert = ({ className, variant = 'default', title, description, children, ...props }) => {
  const icons = {
    default: Info,
    destructive: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
  };
  
  const Icon = icons[variant] || Info;
  
  const baseStyles = 'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-text-secondary';
  
  const variantStyles = {
    default: 'bg-primary-light border-primary text-primary',
    destructive: 'bg-severity-critical-light border-severity-critical text-severity-critical-text',
    success: 'bg-severity-low-light border-severity-low text-severity-low-text',
    warning: 'bg-severity-medium-light border-severity-medium text-severity-medium-text',
  };
  
  return (
    <div className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      <Icon className="h-4 w-4" />
      <div className="grid gap-1">
        {title && <h5 className="text-sm font-medium leading-none">{title}</h5>}
        {description && <div className="text-sm [&_p]:leading-relaxed">{description}</div>}
        {children}
      </div>
    </div>
  );
};

Alert.displayName = 'Alert';

function AlertDialog({ open, onOpenChange, title, description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, children, ...props }) {
  return (
    <AlertPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertPrimitive.Portal>
        <AlertPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <AlertPrimitive.Title className="text-lg font-semibold">{title}</AlertPrimitive.Title>
          <AlertPrimitive.Description className="text-sm text-text-muted">{description}</AlertPrimitive.Description>
          {children}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
            <AlertPrimitive.Cancel className="btn btn-outline">{cancelText}</AlertPrimitive.Cancel>
            <AlertPrimitive.Action onClick={onConfirm} className="btn btn-destructive">{confirmText}</AlertPrimitive.Action>
          </div>
        </AlertPrimitive.Content>
      </AlertPrimitive.Portal>
    </AlertPrimitive.Root>
  );
}

AlertDialog.displayName = 'AlertDialog';

function InlineAlert({ type = 'info', title, children, dismissible = false, onDismiss, className }) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
  };
  
  const colors = {
    info: 'bg-primary-light border-primary text-primary',
    warning: 'bg-severity-medium-light border-severity-medium text-severity-medium-text',
    error: 'bg-severity-critical-light border-severity-critical text-severity-critical-text',
    success: 'bg-severity-low-light border-severity-low text-severity-low-text',
  };
  
  const Icon = icons[type] || Info;
  
  return (
    <div className={cn('relative rounded-lg border p-4 flex gap-3', colors[type], className)} role="alert">
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h5 className="text-sm font-medium">{title}</h5>}
        <div className="text-sm mt-0.5">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

InlineAlert.displayName = 'InlineAlert';

export { Alert, AlertDialog, InlineAlert };

import * as React from 'react';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from '../../lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScrollArea } from '../../components/ui/ScrollArea';
import { Separator } from '../../components/ui/Separator';
import { AlertTriangle, Clock, CheckCircle, X, Bell, Loader2 } from 'lucide-react';
import { EmptyState, Skeleton } from '../../components/ui/States';

const alertTypeConfig = {
  critical_incident: { label: 'Critical Incident', icon: AlertTriangle, color: 'bg-severity-critical-light text-severity-critical', border: 'border-severity-critical' },
  delayed_response: { label: 'Delayed Response', icon: Clock, color: 'bg-severity-high-light text-severity-high', border: 'border-severity-high' },
  escalation: { label: 'Escalation', icon: AlertTriangle, color: 'bg-severity-high-light text-severity-high', border: 'border-severity-high' },
  resource_shortage: { label: 'Resource Shortage', icon: AlertTriangle, color: 'bg-severity-medium-light text-severity-medium', border: 'border-severity-medium' },
};

const alertStatusConfig = {
  active: { label: 'Active', color: 'bg-severity-critical-light text-severity-critical' },
  acknowledged: { label: 'Acknowledged', color: 'bg-severity-high-light text-severity-high' },
  resolved: { label: 'Resolved', color: 'bg-severity-low-light text-severity-low' },
};

export function AlertsPanel({ alerts, isLoading, onAcknowledge, isAcknowledging }) {
  if (isLoading) {
    return (
      <Card className="h-[200px]">
        <CardHeader>
          <CardTitle className="text-base">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 p-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} variant="rectangular" height="56" width="100%" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');

  return (
    <Card className="h-[200px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Active Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="h-5 px-2">{activeAlerts.length}</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {activeAlerts.length === 0 && acknowledgedAlerts.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No alerts"
            description="All clear — no active or recent alerts"
            className="py-8"
          />
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {activeAlerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} onAcknowledge={onAcknowledge} isAcknowledging={isAcknowledging} />
              ))}
              {acknowledgedAlerts.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wider px-2">
                    Acknowledged ({acknowledgedAlerts.length})
                  </p>
                  {acknowledgedAlerts.slice(0, 3).map((alert) => (
                    <AlertItem key={alert.id} alert={alert} onAcknowledge={onAcknowledge} isAcknowledging={isAcknowledging} acknowledged />
                  ))}
                  {acknowledgedAlerts.length > 3 && (
                    <p className="text-xs text-text-muted text-center px-2 py-1">
                      +{acknowledgedAlerts.length - 3} more acknowledged
                    </p>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function AlertItem({ alert, onAcknowledge, isAcknowledging, acknowledged }) {
  const config = alertTypeConfig[alert.alert_type] || alertTypeConfig.critical_incident;
  const statusConfig = alertStatusConfig[alert.status] || alertStatusConfig.active;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative p-3 rounded-lg border transition-colors',
        acknowledged ? 'bg-background-tertiary/50 opacity-70' : 'bg-background',
        config.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-1.5 rounded-lg flex-shrink-0', config.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-medium text-sm text-text-primary truncate">{config.label}</span>
              <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </div>
            <span className="text-xs text-text-muted whitespace-nowrap flex-shrink-0">
              {formatRelativeTime(alert.created_at)}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1 line-clamp-2">{alert.message}</p>
          {alert.incident_id && (
            <p className="text-xs text-text-muted mt-1 font-mono">
              Incident: {alert.incident_id.slice(0, 12)}...
            </p>
          )}
        </div>
      </div>
      {!acknowledged && alert.status === 'active' && (
        <div className="mt-3 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAcknowledge(alert.id)}
            disabled={isAcknowledging}
            className="w-full"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Acknowledge
          </Button>
        </div>
      )}
    </div>
  );
}
import * as React from 'react';
import { useDashboardAlerts, useAllDashboardAlerts, useAcknowledgeAlert, useResolveAlert } from '../hooks';
import { formatRelativeTime } from '../lib/utils';
import { cn } from '../lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { ScrollArea } from '../components/ui/ScrollArea';
import { Input } from '../components/ui/Input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/Select';
import { EmptyState, TableSkeleton, Skeleton } from '../components/ui/States';
import {
  Search,
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
];

const alertTypeConfig = {
  critical_incident: { label: 'Critical Incident', icon: AlertTriangle, color: 'bg-severity-critical-light text-severity-critical' },
  delayed_response: { label: 'Delayed Response', icon: Clock, color: 'bg-severity-high-light text-severity-high' },
  escalation: { label: 'Escalation', icon: AlertTriangle, color: 'bg-severity-high-light text-severity-high' },
  resource_shortage: { label: 'Resource Shortage', icon: AlertTriangle, color: 'bg-severity-medium-light text-severity-medium' },
};

export function AlertsPage() {
  const [statusFilter, setStatusFilter] = React.useState('active');
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: alerts = [], isLoading, isError, error, refetch } = useDashboardAlerts(statusFilter);
  const { data: allAlerts = [] } = useAllDashboardAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  const filteredAlerts = React.useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch = !searchQuery ||
        alert.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.incident_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.id?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [alerts, searchQuery]);

  const activeCount = allAlerts.filter(a => a.status === 'active').length;
  const acknowledgedCount = allAlerts.filter(a => a.status === 'acknowledged').length;
  const resolvedCount = allAlerts.filter(a => a.status === 'resolved').length;

  if (isLoading) {
    return <AlertsSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Alerts</h1>
            <p className="text-sm text-text-muted mt-1">Monitor and manage system alerts</p>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-text-primary mb-2">Failed to load alerts</h3>
            <p className="text-text-muted mb-4">{error?.userMessage || 'Unable to connect to the server'}</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleAcknowledge = (alertId) => {
    acknowledgeAlert.mutate(alertId);
  };

  const handleResolve = (alertId) => {
    resolveAlert.mutate(alertId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Alerts</h1>
          <p className="text-sm text-text-muted mt-1">Monitor and manage system alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Active" value={activeCount} icon={AlertTriangle} iconColor="bg-severity-critical-light text-severity-critical" />
        <StatCard title="Acknowledged" value={acknowledgedCount} icon={Clock} iconColor="bg-severity-high-light text-severity-high" />
        <StatCard title="Resolved" value={resolvedCount} icon={CheckCircle} iconColor="bg-severity-low-light text-severity-low" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-base">Alert Directory</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredAlerts.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No alerts found"
              description={searchQuery
                ? 'Try adjusting your search query.'
                : statusFilter === 'active'
                ? 'All clear — no active alerts'
                : `No ${statusFilter} alerts`}
              className="py-12"
            />
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-48 hidden md:table-cell">Incident</TableHead>
                    <TableHead className="w-48">Created</TableHead>
                    <TableHead className="w-36">Resolved</TableHead>
                    <TableHead className="w-36">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="p-3">
                        <AlertTypeBadge alert={alert} />
                      </TableCell>
                      <TableCell className="p-3">
                        <AlertTypeLabel alert={alert} />
                      </TableCell>
                      <TableCell className="p-3">
                        <StatusBadge status={alert.status} type="alert" />
                      </TableCell>
                      <TableCell className="p-3 max-w-[300px]">
                        <p className="text-sm text-text-secondary truncate max-w-[300px] block">{alert.message}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-3">
                        {alert.incident_id && (
                          <span className="text-sm text-text-muted font-mono truncate block max-w-[120px]">
                            {alert.incident_id.slice(0, 12)}...
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="p-3">
                        <span className="text-sm text-text-secondary whitespace-nowrap">
                          {formatRelativeTime(alert.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="p-3">
                        {alert.resolved_at ? (
                          <span className="text-sm text-text-secondary whitespace-nowrap">
                            {formatRelativeTime(alert.resolved_at)}
                          </span>
                        ) : (
                          <span className="text-sm text-text-muted">—</span>
                        )}
                      </TableCell>
                      <TableCell className="p-3">
                        <AlertActions
                          alert={alert}
                          onAcknowledge={handleAcknowledge}
                          onResolve={handleResolve}
                          isAcknowledging={acknowledgeAlert.isPending}
                          isResolving={resolveAlert.isPending}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, iconColor }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
          </div>
          <div className={cn('p-3 rounded-lg', iconColor)}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertTypeBadge({ alert }) {
  const config = alertTypeConfig[alert.alert_type] || alertTypeConfig.critical_incident;
  const Icon = config.icon;
  return (
    <div className={cn('p-2 rounded-lg flex-shrink-0', config.color)}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

function AlertTypeLabel({ alert }) {
  const config = alertTypeConfig[alert.alert_type] || alertTypeConfig.critical_incident;
  return (
    <span className="font-medium text-sm text-text-primary">{config.label}</span>
  );
}

function AlertActions({ alert, onAcknowledge, onResolve, isAcknowledging, isResolving }) {
  if (alert.status === 'resolved') {
    return (
      <Badge variant="secondary" className="text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        Resolved
      </Badge>
    );
  }

  if (alert.status === 'acknowledged') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onResolve(alert.id)}
        disabled={isResolving}
        className="w-full"
      >
        <CheckCircle className="h-3.5 w-3.5 mr-1" />
        Resolve
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onAcknowledge(alert.id)}
      disabled={isAcknowledging}
      className="w-full"
    >
      <CheckCircle className="h-3.5 w-3.5 mr-1" />
      Acknowledge
    </Button>
  );
}

function AlertsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton variant="text" width="40%" className="mb-2" /><Skeleton variant="text" width="60%" /></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-0">
          <TableSkeleton rows={5} columns={8} />
        </CardContent>
      </Card>
    </div>
  );
}
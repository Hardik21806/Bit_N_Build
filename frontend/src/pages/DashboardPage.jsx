import * as React from 'react';
import { useDashboardOverview, useDashboardAlerts, useAcknowledgeAlert, useAssignmentsForIncidents, useIncidentSummary } from '../hooks';
import { formatRelativeTime, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/Card';
import { Badge, SeverityBadge, StatusBadge, ResourceTypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { ScrollArea } from '../components/ui/ScrollArea';
import { Separator } from '../components/ui/Separator';
import { AlertTriangle, MapPin, Users, Clock, Activity, Loader2, RefreshCw, ChevronRight, ChevronLeft, Truck, AlertCircle, FileText, Shield } from 'lucide-react';
import { DashboardMap } from './components/DashboardMap';
import { AlertsPanel } from './components/AlertsPanel';
import { ErrorState, EmptyState, TableSkeleton, Skeleton } from '../components/ui/States';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Label } from '../components/ui/Label';

const severityOrder = ['critical', 'high', 'medium', 'low'];
const severityLabels = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

export function DashboardPage() {
  const { data: overview, isLoading, isError, error, refetch, fetchStatus } = useDashboardOverview();
  const { data: alerts = [], isLoading: alertsLoading } = useDashboardAlerts('active');
  const acknowledgeAlert = useAcknowledgeAlert();
  const [selectedIncident, setSelectedIncident] = React.useState(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const incidentIds = React.useMemo(() => (overview?.incidents || []).map(i => i.id), [overview?.incidents]);
  const { data: assignmentsByIncident = {}, isLoading: assignmentsLoading } = useAssignmentsForIncidents(incidentIds);
  const { data: incidentSummary, isLoading: summaryLoading } = useIncidentSummary(selectedIncident?.id);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        description={error?.userMessage || 'Unable to connect to the server'}
        onRetry={() => refetch()}
      />
    );
  }

  const activeEmergencies = overview?.active_emergencies || 0;
  const severityBreakdown = overview?.severity_breakdown || {};
  const statusBreakdown = overview?.status_breakdown || {};
  const incidentsWithTeams = overview?.incidents_with_teams_assigned || 0;
  const incidents = overview?.incidents || [];

  const handleRowClick = (incident) => {
    setSelectedIncident(incident);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Operations Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">Real-time emergency response monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Emergencies"
          value={activeEmergencies}
          icon={AlertTriangle}
          iconColor="bg-severity-critical-light text-severity-critical"
          trend={activeEmergencies > 0 ? `${activeEmergencies} requiring attention` : 'All clear'}
        />
        <StatCard
          title="Critical Severity"
          value={severityBreakdown.critical || 0}
          icon={AlertTriangle}
          iconColor="bg-severity-critical-light text-severity-critical"
          variant="critical"
        />
        <StatCard
          title="Resources Deployed"
          value={incidentsWithTeams}
          icon={Users}
          iconColor="bg-primary-light text-primary"
          trend={`${incidentsWithTeams} of ${activeEmergencies} incidents`}
        />
        <StatCard
          title="Active Alerts"
          value={alerts.length}
          icon={Activity}
          iconColor="bg-severity-high-light text-severity-high"
          trend={alerts.length > 0 ? 'Requires attention' : 'No active alerts'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <IncidentsTable
            incidents={incidents}
            assignmentsByIncident={assignmentsByIncident}
            assignmentsLoading={assignmentsLoading}
            onSelect={handleRowClick}
            selectedId={selectedIncident?.id}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SeverityBreakdownCard breakdown={severityBreakdown} activeTotal={activeEmergencies} />
            <StatusBreakdownCard breakdown={statusBreakdown} />
          </div>
        </div>
        <div className="space-y-6">
          <DashboardMap
            incidents={incidents}
            selectedIncidentId={selectedIncident?.id}
            onSelect={handleRowClick}
          />
          <AlertsPanel
            alerts={alerts}
            isLoading={alertsLoading}
            onAcknowledge={(id) => acknowledgeAlert.mutate(id)}
            isAcknowledging={acknowledgeAlert.isPending}
          />
        </div>
      </div>

      <IncidentDetailDialog
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedIncident(null); }}
        incident={selectedIncident}
        assignments={selectedIncident ? assignmentsByIncident[selectedIncident.id] : []}
        assignmentsLoading={assignmentsLoading}
        summary={incidentSummary}
        summaryLoading={summaryLoading}
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, iconColor, trend }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
            {trend && <p className="text-xs text-text-muted mt-1">{trend}</p>}
          </div>
          <div className={cn('p-3 rounded-lg', iconColor)}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityBreakdownCard({ breakdown, activeTotal }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Severity Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {severityOrder.map((severity) => {
            const count = breakdown[severity] || 0;
            return (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={severity} showIcon />
                  <span className="text-sm font-medium text-text-primary capitalize">{severityLabels[severity]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-text-primary">{count}</span>
                  <div className="h-2 w-24 bg-background-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', `bg-severity-${severity}`)}
                      style={{ width: `${activeTotal > 0 ? (count / activeTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBreakdownCard({ breakdown }) {
  const statusOrder = ['reported', 'verified', 'dispatched', 'in_progress', 'resolved', 'closed'];
  const statusLabels = {
    reported: 'Reported',
    verified: 'Verified',
    dispatched: 'Dispatched',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {statusOrder.map((status) => {
            const count = breakdown[status] || 0;
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  <span className="text-sm font-medium text-text-primary">{statusLabels[status]}</span>
                </div>
                <span className="text-lg font-bold text-text-primary">{count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function IncidentsTable({ incidents, assignmentsByIncident, assignmentsLoading, onSelect, selectedId }) {
  if (!incidents.length) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={AlertTriangle}
            title="No active incidents"
            description="All emergencies have been resolved or there are no active reports at this time."
          />
        </CardContent>
      </Card>
    );
  }

  const sortedIncidents = [...incidents].sort((a, b) => {
    const severityDiff = (severityOrder.indexOf(a.severity) || 99) - (severityOrder.indexOf(b.severity) || 99);
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.reported_at) - new Date(a.reported_at);
  });

  const getAssignmentStatus = (incidentId) => {
    const assignments = assignmentsByIncident[incidentId] || [];
    if (!assignments.length) return null;
    return assignments[0].status;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Active Incidents</CardTitle>
          {assignmentsLoading && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading assignments...
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Incident</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="w-32">Severity</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-40 hidden lg:table-cell">Assignment</TableHead>
                <TableHead className="w-48">Reported</TableHead>
                <TableHead className="w-36">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIncidents.map((incident) => {
                const assignment = getAssignmentStatus(incident.id);
                return (
                  <TableRow
                    key={incident.id}
                    onClick={() => onSelect(incident)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      selectedId === incident.id && 'bg-primary-light/50'
                    )}
                  >
                    <TableCell className="p-3">
                      <SeverityBadge severity={incident.severity} />
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="font-medium text-text-primary truncate max-w-xs">
                        {incident.id.slice(0, 12)}...
                      </div>
                      <div className="text-xs text-text-muted truncate max-w-xs mt-0.5">
                        {incident.description}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell p-3">
                      <Badge variant="outline" className="text-xs">
                        {incident.incident_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3">
                      <SeverityBadge severity={incident.severity} />
                    </TableCell>
                    <TableCell className="p-3">
                      <StatusBadge status={incident.status} />
                    </TableCell>
                    <TableCell className="w-40 hidden lg:table-cell p-3">
                      {assignmentsLoading ? (
                        <Skeleton variant="text" width="80%" height="20px" />
                      ) : assignment ? (
                        <StatusBadge status={assignment} type="assignment" />
                      ) : (
                        <Badge variant="outline" className="text-xs text-text-muted">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell className="p-3">
                      <span className="text-sm text-text-secondary whitespace-nowrap">
                        {formatRelativeTime(incident.reported_at)}
                      </span>
                    </TableCell>
                    <TableCell className="p-3">
                      <span className="text-sm text-text-muted truncate max-w-[150px] block">
                        {incident.address || `${incident.location_lat?.toFixed(4)}, ${incident.location_lng?.toFixed(4)}`}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function IncidentDetailDialog({ open, onClose, incident, assignments, assignmentsLoading, summary, summaryLoading }) {
  if (!incident) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] w-full">
        <DialogHeader className="flex flex-row items-start justify-between gap-4 p-6 pb-4 border-b">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={incident.severity} showIcon />
              <span className="font-mono text-sm text-text-primary">{incident.id.slice(0, 12)}...</span>
              <StatusBadge status={incident.status} />
            </div>
            <DialogTitle className="text-lg font-semibold text-text-primary truncate">
              {incident.incident_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown Incident'}
            </DialogTitle>
            <DialogDescription className="text-sm text-text-muted">
              {formatDate(incident.reported_at)} · {incident.address || `${incident.location_lat?.toFixed(4)}, ${incident.location_lng?.toFixed(4)}`}
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <DialogContent className="p-6 pb-0" style={{ overflow: 'auto', maxHeight: '60vh' }}>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assignments">Assignments ({assignments?.length || 0})</TabsTrigger>
              <TabsTrigger value="ai" disabled={summaryLoading}>AI Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField label="Incident ID" value={incident.id} monospace />
                <DetailField label="Type" value={incident.incident_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} />
                <DetailField label="Severity" value={<SeverityBadge severity={incident.severity} />} />
                <DetailField label="Status" value={<StatusBadge status={incident.status} />} />
                <DetailField label="Priority" value={incident.priority} monospace />
                <DetailField label="Confidence" value={incident.confidence ? `${Math.round(incident.confidence * 100)}%` : 'N/A'} />
                <DetailField label="Report Count" value={incident.report_count || 1} />
                <DetailField label="Source" value={incident.source?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} />
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-text-secondary mb-1 block">Description</Label>
                <p className="text-text-primary whitespace-pre-wrap">{incident.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-text-secondary mb-1 block">Location</Label>
                <div className="flex items-center gap-2 text-text-primary">
                  <MapPin className="h-4 w-4 text-text-muted flex-shrink-0" />
                  <span>{incident.address || `${incident.location_lat?.toFixed(6)}, ${incident.location_lng?.toFixed(6)}`}</span>
                </div>
                <div className="text-xs text-text-muted mt-1 font-mono">
                  Lat: {incident.location_lat?.toFixed(6)}, Lng: {incident.location_lng?.toFixed(6)}
                </div>
              </div>

              {incident.sla_deadline && (
                <div className="p-3 rounded-lg bg-severity-high-light border border-severity-high">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-severity-high" />
                    <span className="text-sm font-medium text-severity-high-text">SLA Deadline: {formatDate(incident.sla_deadline)}</span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4 pt-4">
              {assignmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} variant="rectangular" height="60" width="100%" />)}
                </div>
              ) : assignments.length === 0 ? (
                <EmptyState
                  icon={Truck}
                  title="No resources assigned"
                  description="This incident has no resource assignments yet."
                  action={
                    <Button variant="outline" size="sm" onClick={() => { onClose(); window.location.href = '/resources'; }}>
                      <Truck className="h-4 w-4 mr-1" />
                      View Available Resources
                    </Button>
                  }
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {assignment.resource_type && <ResourceTypeBadge type={assignment.resource_type} />}
                            <span className="font-medium text-text-primary">
                              {assignment.resource_name || assignment.resource_id || 'Unknown Resource'}
                            </span>
                            <StatusBadge status={assignment.status} type="assignment" />
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                            {assignment.eta_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                ETA: {assignment.eta_minutes} min
                              </span>
                            )}
                            {assignment.resource_location_lat && assignment.resource_location_lng && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {assignment.resource_location_lat.toFixed(4)}, {assignment.resource_location_lng.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-text-muted">
                          <p>Assigned: {formatRelativeTime(assignment.assigned_at)}</p>
                          <p className="font-mono">{assignment.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai" className="space-y-4 pt-4">
              {summaryLoading ? (
                <div className="space-y-4">
                  <Skeleton variant="rectangular" height="100" width="100%" />
                  <Skeleton variant="rectangular" height="100" width="100%" />
                </div>
              ) : summary ? (
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-text-secondary mb-2 block flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      AI Summary
                    </Label>
                    <div className="p-4 rounded-lg bg-background-tertiary border border-border">
                      <p className="text-text-primary whitespace-pre-wrap">{summary.summary}</p>
                    </div>
                  </div>

                  {summary.recommendations && (
                    <div>
                      <Label className="text-sm font-medium text-text-secondary mb-2 block flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        AI Recommendations
                      </Label>
                      <div className="p-4 rounded-lg bg-background-tertiary border border-border">
                        <p className="text-text-primary whitespace-pre-wrap">{summary.recommendations}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="AI analysis not available"
                  description="AI summary and recommendations will be generated after incident classification."
                  className="py-8"
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>

        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          <Button variant="default" onClick={() => { onClose(); window.location.href = `/incidents/${incident.id}`; }}>
            View Full Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailField({ label, value, monospace }) {
  return (
    <div>
      <Label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1 block">{label}</Label>
      <p className={cn('text-sm text-text-primary', monospace && 'font-mono')}>
        {typeof value === 'object' ? value : (value ?? '—')}
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton variant="text" width="40%" className="mb-2" /><Skeleton variant="text" width="60%" /></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card><CardContent className="pt-0"><TableSkeleton rows={5} columns={8} /></CardContent></Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardContent className="pt-0"><div className="space-y-3 p-6">{[1,2,3,4].map(i => (<Skeleton key={i} variant="rectangular" height="24" width="100%" />))}</div></CardContent></Card>
            <Card><CardContent className="pt-0"><div className="space-y-3 p-6">{[1,2,3,4,5,6].map(i => (<Skeleton key={i} variant="rectangular" height="24" width="100%" />))}</div></CardContent></Card>
          </div>
        </div>
        <div className="space-y-6">
          <Card><CardContent className="pt-0"><Skeleton variant="rectangular" height="400" width="100%" /></CardContent></Card>
          <Card><CardContent className="pt-0"><div className="space-y-3 p-6">{[1,2,3].map(i => (<Skeleton key={i} variant="rectangular" height="48" width="100%" />))}</div></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncident, useIncidentSummary, useAssignments, useUpdateIncident, useMergeIncident, useAvailableResources, useAssignResource } from '../hooks';
import { formatRelativeTime, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/Card';
import { Badge, SeverityBadge, StatusBadge, ResourceTypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../components/ui/Dialog';
import { ScrollArea } from '../components/ui/ScrollArea';
import { Separator } from '../components/ui/Separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Textarea } from '../components/ui/Textarea';
import {
  AlertTriangle, MapPin, Users, Clock, Activity, Loader2, RefreshCw, ChevronRight, ChevronLeft,
  Truck, AlertCircle, FileText, Shield, Edit, Trash2, Copy, Link2, MapPin as MapPinIcon,
  Eye, EyeOff, Search, Plus, Minus
} from 'lucide-react';
import { ErrorState, EmptyState, Skeleton } from '../components/ui/States';
import { Alert } from '../components/ui/Alert';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/Tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../components/ui/DropdownMenu';

const statusOrder = ['reported', 'verified', 'dispatched', 'in_progress', 'resolved', 'closed', 'duplicate'];
const statusLabels = {
  reported: 'Reported',
  verified: 'Verified',
  dispatched: 'Dispatched',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  duplicate: 'Duplicate',
};

const assignmentStatusLabels = {
  assigned: 'Assigned',
  en_route: 'En Route',
  on_scene: 'On Scene',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateIncident = useUpdateIncident();
  const mergeIncident = useMergeIncident();
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = React.useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [assignForm, setAssignForm] = React.useState({ resource_id: '', eta_minutes: '' });
  const [assignError, setAssignError] = React.useState(null);

  const { data: incident, isLoading, isError, error, refetch } = useIncident(id);
  const { data: summary, isLoading: summaryLoading } = useIncidentSummary(id);
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments(id);
  const { data: availableResources = [], isLoading: resourcesLoading } = useAvailableResources();
  const assignResource = useAssignResource();

  if (isLoading) {
    return <IncidentDetailSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Incident not found"
        description={error?.userMessage || 'Unable to load incident details'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!incident) {
    return (
      <ErrorState
        title="Incident not found"
        description="The requested incident does not exist"
        onRetry={() => refetch()}
      />
    );
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateIncident.mutateAsync({ id, data: { status: newStatus } });
      setStatusDialogOpen(false);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignError(null);
    if (!assignForm.resource_id) {
      setAssignError('Please select a resource');
      return;
    }
    try {
      await assignResource.mutateAsync({
        incident_id: id,
        resource_id: assignForm.resource_id,
        eta_minutes: parseInt(assignForm.eta_minutes) || undefined,
      });
      setAssignDialogOpen(false);
      setAssignForm({ resource_id: '', eta_minutes: '' });
    } catch (err) {
      setAssignError(err?.userMessage || err?.message || 'Failed to assign resource');
    }
  };

  const handleMerge = async (masterId) => {
    try {
      await mergeIncident.mutateAsync({ id, masterId });
      setMergeDialogOpen(false);
    } catch (err) {
      console.error('Failed to merge:', err);
    }
  };

  const formatAssignmentStatus = (status) => assignmentStatusLabels[status] || status;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SeverityBadge severity={incident.severity} showIcon />
            <span className="font-mono text-sm text-text-primary">{incident.id.slice(0, 12)}...</span>
            <StatusBadge status={incident.status} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            {incident.incident_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown Incident'}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {formatDate(incident.reported_at)} · {incident.address || `${incident.location_lat?.toFixed(4)}, ${incident.location_lng?.toFixed(4)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/incidents')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Incident Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssignDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Assign Resource
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMergeDialogOpen(true)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Merge Incident
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(incident.id)} className="text-primary">
                <Copy className="h-4 w-4 mr-2" />
                Copy Incident ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments ({assignments.length})</TabsTrigger>
          <TabsTrigger value="ai" disabled={summaryLoading}>AI Analysis</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Incident Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
<DetailField label="Incident ID" value={incident.id} monospace copyable copyValue={incident.id} />
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

                  {incident.notes && (
                    <div className="p-3 rounded-lg bg-background-tertiary border border-border">
                      <Label className="text-sm font-medium text-text-secondary mb-1 block">Notes</Label>
                      <p className="text-text-primary whitespace-pre-wrap">{incident.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {incident.duplicate_of && (
                <Card className="border-severity-high">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-severity-high" />
                      Duplicate of Incident
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-text-primary">{incident.duplicate_of.slice(0, 12)}...</p>
                        <p className="text-sm text-text-muted">This incident was consolidated into the master incident above</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/incidents/${incident.duplicate_of}`)}>
                        View Master Incident
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <MetricRow label="Reported" value={formatRelativeTime(incident.reported_at)} />
                  {incident.verified_at && <MetricRow label="Verified" value={formatRelativeTime(incident.verified_at)} />}
                  {incident.assigned_at && <MetricRow label="Assigned" value={formatRelativeTime(incident.assigned_at)} />}
                  {incident.resolved_at && <MetricRow label="Resolved" value={formatRelativeTime(incident.resolved_at)} />}
                  {incident.sla_deadline && (
                    <MetricRow
                      label="SLA Deadline"
                      value={formatDate(incident.sla_deadline)}
                      variant="warning"
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    Map Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="aspect-square rounded-lg overflow-hidden border border-border bg-background-tertiary relative">
                    <iframe
                      title="Incident location"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${incident.location_lng - 0.01}%2C${incident.location_lat - 0.01}%2C${incident.location_lng + 0.01}%2C${incident.location_lat + 0.01}&layer=mapnik&marker=${incident.location_lat}%2C${incident.location_lng}`}
                      allowFullScreen
                    />
                  </div>
                  <div className="mt-2 text-xs text-text-muted">
                    Click map for full view
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Resource Assignments</h2>
            <Button size="sm" onClick={() => setAssignDialogOpen(true)} disabled={resourcesLoading}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Assign Resource
            </Button>
          </div>

          {assignmentsLoading ? (
            <Card><CardContent className="pt-0"><div className="space-y-3 p-6">{[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height="80" width="100%" />)}</div></CardContent></Card>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Truck}
                  title="No resources assigned"
                  description="This incident has no resource assignments yet. Click 'Assign Resource' to dispatch a team."
                  action={<Button size="sm" onClick={() => setAssignDialogOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Assign Resource</Button>}
                  className="py-8"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-0">
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead className="w-36">Type</TableHead>
                        <TableHead className="w-36">Status</TableHead>
                        <TableHead className="w-36">ETA</TableHead>
                        <TableHead>Assigned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="p-3">
                            {assignment.resource_type && <ResourceTypeBadge type={assignment.resource_type} />}
                          </TableCell>
                          <TableCell className="p-3">
                            <div className="font-medium text-text-primary">
                              {assignment.resource_name || assignment.resource_id || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell className="p-3">
                            <Badge variant="outline" className="text-xs">
                              {assignment.resource_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-3">
                            <StatusBadge status={assignment.status} type="assignment" />
                          </TableCell>
                          <TableCell className="p-3">
                            {assignment.eta_minutes ? (
                              <span className="flex items-center gap-1 text-sm text-text-secondary">
                                <Clock className="h-3.5 w-3.5" />
                                {assignment.eta_minutes} min
                              </span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </TableCell>
                          <TableCell className="p-3">
                            <span className="text-sm text-text-secondary whitespace-nowrap">
                              {formatRelativeTime(assignment.assigned_at)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-6 pt-6">
          {summaryLoading ? (
            <div className="space-y-6">
              <Card><CardContent className="p-6"><Skeleton variant="rectangular" height="120" width="100%" /></CardContent></Card>
              <Card><CardContent className="p-6"><Skeleton variant="rectangular" height="120" width="100%" /></CardContent></Card>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-background-tertiary border border-border">
                    <p className="text-text-primary whitespace-pre-wrap">{summary.summary}</p>
                  </div>
                </CardContent>
              </Card>

              {summary.recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-background-tertiary border border-border">
                      <p className="text-text-primary whitespace-pre-wrap">{summary.recommendations}</p>
                    </div>
</CardContent>
              </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={FileText}
                  title="AI analysis not available"
                  description="AI summary and recommendations will be generated after incident classification."
                  className="py-8"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="duplicates" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Duplicate Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incident.duplicate_of ? (
                <Alert
                  variant="default"
                  className="bg-severity-high-light border-severity-high"
                  description={
                    <>
                      This incident was detected as a duplicate and consolidated into master incident <strong className="font-mono">{incident.duplicate_of.slice(0, 12)}...</strong>.
                      <Button variant="link" size="sm" className="ml-2" onClick={() => navigate(`/incidents/${incident.duplicate_of}`)}>
                        View Master Incident
                      </Button>
                    </>
                  }
                >
                  <AlertTriangle className="h-4 w-4 text-severity-high" />
                </Alert>
              ) : (
                <div className="space-y-4">
                  <p className="text-text-secondary">
                    No duplicates detected for this incident. The system automatically checks for similar reports
                    within 1.5km radius and 60-minute time window using text similarity analysis.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-background-tertiary border border-border">
                      <p className="text-text-muted">Distance Threshold</p>
                      <p className="font-mono text-text-primary">1.5 km</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background-tertiary border border-border">
                      <p className="text-text-muted">Time Window</p>
                      <p className="font-mono text-text-primary">60 minutes</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background-tertiary border border-border">
                      <p className="text-text-muted">Text Similarity</p>
                      <p className="font-mono text-text-primary">70%</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StatusUpdateDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        currentStatus={incident.status}
        onConfirm={handleStatusUpdate}
        isPending={updateIncident.isPending}
      />

      <AssignResourceDialog
        open={assignDialogOpen}
        onClose={() => { setAssignDialogOpen(false); setAssignError(null); setAssignForm({ resource_id: '', eta_minutes: '' }); }}
        resources={availableResources}
        resourcesLoading={resourcesLoading}
        onConfirm={handleAssign}
        isPending={assignResource.isPending}
        error={assignError}
        assignForm={assignForm}
        setAssignForm={setAssignForm}
      />

      <MergeDialog
        open={mergeDialogOpen}
        onClose={() => setMergeDialogOpen(false)}
        incidentId={id}
        onConfirm={handleMerge}
        isPending={mergeIncident.isPending}
      />
    </div>
  );
}

function DetailField({ label, value, monospace, copyable, copyValue }) {
  return (
    <div>
      <Label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1 block">{label}</Label>
      <div className="flex items-center gap-2">
        <p className={cn('text-sm text-text-primary', monospace && 'font-mono', 'flex-1')}>
          {typeof value === 'object' ? value : (value ?? '—')}
        </p>
        {copyable && copyValue && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigator.clipboard.writeText(copyValue)}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value, variant }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={cn('text-sm font-medium', variant === 'warning' && 'text-severity-high', 'text-text-primary')}>{value}</span>
    </div>
  );
}

function StatusUpdateDialog({ open, onClose, currentStatus, onConfirm, isPending }) {
  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Incident Status</DialogTitle>
          <DialogDescription>
            Current status: <strong>{statusLabels[currentStatus] || currentStatus}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 py-4">
          {statusOrder.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              disabled={status === currentStatus}
              className={cn(
                'p-3 rounded-lg border-2 text-sm font-medium transition-all',
                selectedStatus === status
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-border hover:border-primary-hover hover:bg-background-tertiary',
                status === currentStatus && 'opacity-50 cursor-not-allowed'
              )}
            >
              <StatusBadge status={status} className="w-full justify-center" />
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="default" onClick={() => { onConfirm(selectedStatus); onClose(); }} disabled={isPending || selectedStatus === currentStatus}>
            {isPending ? 'Updating...' : 'Confirm Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignResourceDialog({ open, onClose, resources, resourcesLoading, onConfirm, isPending, error, assignForm, setAssignForm }) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Resource</DialogTitle>
          <DialogDescription>
            Select an available resource to dispatch to this incident
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onConfirm} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="resource_id">Resource <span className="text-severity-critical">*</span></Label>
            <Select
              value={assignForm.resource_id}
              onValueChange={(v) => setAssignForm(prev => ({ ...prev, resource_id: v }))}
              disabled={resourcesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={resourcesLoading ? 'Loading resources...' : 'Select a resource'} />
              </SelectTrigger>
              <SelectContent>
                {resources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    <div className="flex items-center gap-2">
                      {resource.resource_type && <ResourceTypeBadge type={resource.resource_type} />}
                      <span>{resource.name} ({resource.resource_type?.replace('_', ' ')})</span>
                    </div>
                  </SelectItem>
                ))}
                {resources.length === 0 && !resourcesLoading && (
                  <SelectItem disabled value="">
                    No available resources
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eta_minutes">Estimated Time of Arrival (minutes, optional)</Label>
            <Input
              id="eta_minutes"
              type="number"
              min="1"
              max="1440"
              value={assignForm.eta_minutes}
              onChange={(e) => setAssignForm(prev => ({ ...prev, eta_minutes: e.target.value }))}
              placeholder="e.g., 15"
            />
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="text-sm"
              description={error}
            >
              <AlertCircle className="h-4 w-4" />
            </Alert>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" form={undefined} onClick={() => onConfirm(new Event('submit'))} disabled={isPending || !assignForm.resource_id || resourcesLoading}>
            {isPending ? 'Assigning...' : 'Assign Resource'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MergeDialog({ open, onClose, incidentId, onConfirm, isPending }) {
  const [masterId, setMasterId] = React.useState('');

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge Incidents</DialogTitle>
          <DialogDescription>
            Enter the master incident ID to merge this incident into. The current incident will be marked as duplicate.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="master_id">Master Incident ID <span className="text-severity-critical">*</span></Label>
            <Input
              id="master_id"
              value={masterId}
              onChange={(e) => setMasterId(e.target.value)}
              placeholder="e.g., abc123-def456-ghi789"
              autoFocus
            />
            <p className="text-xs text-text-muted">The master incident will retain all data. This incident will be marked as duplicate.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(masterId); onClose(); }} disabled={isPending || !masterId.trim() || masterId === incidentId}>
            {isPending ? 'Merging...' : 'Confirm Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IncidentDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="h-8 bg-background-tertiary rounded w-1/4 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card><CardContent className="p-6 space-y-4">{[1,2,3,4,5,6].map(i => <Skeleton key={i} variant="rectangular" height="60" width="100%" />)}</CardContent></Card>
        </div>
        <div className="space-y-6">
          <Card><CardContent className="p-6"><Skeleton variant="rectangular" height="200" width="100%" /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
import * as React from 'react';
import { useMemo, useState } from 'react';
import { useAllAssignments, useUpdateAssignmentStatus } from '../hooks';
import { formatRelativeTime } from '../lib/utils';
import { cn } from '../lib/utils';
import {
  Card,
  CardContent,
} from '../components/ui/Card';
import { Badge, SeverityBadge, StatusBadge, ResourceTypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { ScrollArea } from '../components/ui/ScrollArea';
import { RefreshCw, Truck, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { EmptyState, ErrorState, TableSkeleton , Skeleton } from '../components/ui/States';

const assignmentStatusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'en_route', label: 'En Route' },
  { value: 'on_scene', label: 'On Scene' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const assignmentStatusOrder = ['assigned', 'en_route', 'on_scene', 'completed', 'cancelled'];

export function AssignmentsPage() {
  const [filters, setFilters] = useState({
    status: '',
    incident_id: '',
    search: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: 'assigned_at', direction: 'desc' });
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const { data: assignments = [], isLoading, isError, error, refetch } = useAllAssignments(filters);
  const updateAssignmentStatus = useUpdateAssignmentStatus();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'status') {
        aVal = assignmentStatusOrder.indexOf(aVal);
        bVal = assignmentStatusOrder.indexOf(bVal);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      } else if (aVal instanceof Date || typeof aVal === 'string') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [assignments, sortConfig]);

  const filteredAssignments = useMemo(() => {
    let result = sortedAssignments;

    if (filters.status) {
      result = result.filter(a => a.status === filters.status);
    }

    if (filters.incident_id) {
      result = result.filter(a => a.incident_id === filters.incident_id);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(a =>
        a.id?.toLowerCase().includes(search) ||
        a.resource_name?.toLowerCase().includes(search) ||
        a.resource_type?.toLowerCase().includes(search) ||
        a.incident?.incident_type?.toLowerCase().includes(search) ||
        a.incident?.id?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [sortedAssignments, filters]);

  const openStatusDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedAssignment) return;
    try {
      await updateAssignmentStatus.mutateAsync({ id: selectedAssignment.id, status: newStatus });
      setStatusDialogOpen(false);
      setSelectedAssignment(null);
    } catch (err) {
      console.error('Failed to update assignment status:', err);
    }
  };

  if (isLoading) {
    return <AssignmentsSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load assignments"
        description={error?.userMessage || 'Unable to fetch assignments from the server'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Resource Assignments</h1>
          <p className="text-sm text-text-muted mt-1">Track and manage all resource assignments across incidents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="sr-only">Search assignments</Label>
              <Input
                id="search"
                placeholder="Search assignments..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {assignmentStatusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.incident_id} onValueChange={(v) => handleFilterChange('incident_id', v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Incident" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Incidents</SelectItem>
                  {(() => {
                    const seen = new Set();
                    return assignments
                      .filter(a => a.incident?.id && !seen.has(a.incident.id) && seen.add(a.incident.id))
                      .map(inc => (
                        <SelectItem key={inc.incident.id} value={inc.incident.id}>
                          {inc.incident.id.slice(0, 12)}... - {inc.incident.incident_type?.replace('_', ' ')}
                        </SelectItem>
                      ));
                  })()}
                </SelectContent></Select>
            </div>
          </div>

          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">
                      Assignment ID
                      {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Resource</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      Status
                      {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Incident</TableHead>
                  <TableHead className="hidden lg:table-cell">Incident Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Incident Severity</TableHead>
                  <TableHead className="w-40">ETA</TableHead>
                  <TableHead className="cursor-pointer hidden lg:table-cell" onClick={() => handleSort('assigned_at')}>
                    <div className="flex items-center gap-1">
                      Assigned
                      {sortConfig.key === 'assigned_at' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                    </div>
                  </TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center">
                      <EmptyState
                        icon={Truck}
                        title="No assignments found"
                        description="Try adjusting your filters or search terms"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="p-3">
                        <span className="font-mono text-sm text-text-primary">{assignment.id.slice(0, 12)}...</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-3">
                        <div className="flex items-center gap-2">
                          {assignment.resource_type && <ResourceTypeBadge type={assignment.resource_type} />}
                          <span className="font-medium text-text-primary">
                            {assignment.resource_name || assignment.resource_id || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-3">
                        <Badge variant="outline" className="text-xs">
                          {assignment.resource_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3">
                        <StatusBadge status={assignment.status} type="assignment" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-3">
                        <div>
                          <div className="font-mono text-xs text-text-primary truncate max-w-[120px]">
                            {assignment.incident?.id.slice(0, 12)}...
                          </div>
                          <div className="text-xs text-text-muted truncate max-w-[120px]">
                            {assignment.incident?.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-3">
                        <Badge variant="outline" className="text-xs">
                          {assignment.incident?.incident_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-3">
                        {assignment.incident?.severity && (
                          <SeverityBadge severity={assignment.incident.severity} />
                        )}
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
                      <TableCell className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStatusDialog(assignment)}
                          disabled={updateAssignmentStatus.isPending}
                        >
                          Update Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <StatusUpdateDialog
        open={statusDialogOpen}
        onClose={() => { setStatusDialogOpen(false); setSelectedAssignment(null); }}
        assignment={selectedAssignment}
        onConfirm={handleStatusUpdate}
        isPending={updateAssignmentStatus.isPending}
      />
    </div>
  );
}

function StatusUpdateDialog({ open, onClose, assignment, onConfirm, isPending }) {
  const [selectedStatus, setSelectedStatus] = React.useState(assignment?.status || 'assigned');

  if (!open || !assignment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Assignment Status</DialogTitle>
          <DialogDescription>
            Current status: <strong>{assignment.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong>
            <br />
            Resource: {assignment.resource_name || assignment.resource_id}
            <br />
            Incident: {assignment.incident?.id?.slice(0, 12)}...
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 py-4">
          {assignmentStatusOrder.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              disabled={status === assignment.status}
              className={cn(
                'p-3 rounded-lg border-2 text-sm font-medium transition-all',
                selectedStatus === status
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-border hover:border-primary-hover hover:bg-background-tertiary',
                status === assignment.status && 'opacity-50 cursor-not-allowed'
              )}
            >
              <StatusBadge status={status} type="assignment" className="w-full justify-center" />
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="default" onClick={() => { onConfirm(selectedStatus); onClose(); }} disabled={isPending || selectedStatus === assignment?.status}>
            {isPending ? 'Updating...' : 'Confirm Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignmentsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><Skeleton variant="text" width="30%" className="h-6" /><Skeleton variant="text" width="50%" className="h-4 mt-1" /></div>
      </div>
      <Card><CardContent className="p-4 pt-6"><div className="flex flex-col sm:flex-row gap-4 mb-4">{[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height="42" width="200px" />)}</div><TableSkeleton rows={5} columns={8} /></CardContent></Card>
    </div>
  );
}
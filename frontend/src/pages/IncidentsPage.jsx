import * as React from 'react';
import { useState, useMemo } from 'react';
import { useIncidents, useMergeIncident } from '../hooks';
import { formatRelativeTime, formatDate, truncate, getSeverityRank, getStatusRank } from '../lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/Card';
import { Badge, SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { ScrollArea } from '../components/ui/ScrollArea';
import { Separator } from '../components/ui/Separator';
import { AlertTriangle, Search, Filter, ChevronDown, ChevronUp, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { PageLoading, EmptyState, ErrorState, TableSkeleton } from '../components/ui/States';
import { cn } from '../lib/utils';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'reported', label: 'Reported' },
  { value: 'verified', label: 'Verified' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'duplicate', label: 'Duplicate' },
];

const severityOptions = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'flood', label: 'Flood' },
  { value: 'fire', label: 'Fire' },
  { value: 'industrial_accident', label: 'Industrial Accident' },
  { value: 'road_accident', label: 'Road Accident' },
  { value: 'medical_emergency', label: 'Medical Emergency' },
  { value: 'structural_collapse', label: 'Structural Collapse' },
  { value: 'other', label: 'Other' },
];

export function IncidentsPage() {
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    incident_type: '',
    search: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: 'reported_at', direction: 'desc' });
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [masterIncidentId, setMasterIncidentId] = useState('');

  const { data: incidents = [], isLoading, isError, error, refetch } = useIncidents(filters);
  const mergeMutation = useMergeIncident();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'severity') {
        aVal = getSeverityRank(aVal);
        bVal = getSeverityRank(bVal);
      } else if (sortConfig.key === 'status') {
        aVal = getStatusRank(aVal);
        bVal = getStatusRank(bVal);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [incidents, sortConfig]);

  const filteredIncidents = useMemo(() => {
    if (!filters.search) return sortedIncidents;
    const search = filters.search.toLowerCase();
    return sortedIncidents.filter(inc =>
      inc.id.toLowerCase().includes(search) ||
      inc.description?.toLowerCase().includes(search) ||
      inc.address?.toLowerCase().includes(search) ||
      inc.incident_type?.toLowerCase().includes(search)
    );
  }, [sortedIncidents, filters.search]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIncidents(filteredIncidents.map(i => i.id));
    } else {
      setSelectedIncidents([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    setSelectedIncidents(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const openMergeDialog = (masterId) => {
    setMasterIncidentId(masterId);
    setMergeDialogOpen(true);
  };

  const handleMerge = async () => {
    if (!masterIncidentId || selectedIncidents.length === 0) return;
    for (const id of selectedIncidents) {
      if (id !== masterIncidentId) {
        await mergeMutation.mutateAsync({ id, masterId: masterIncidentId });
      }
    }
    setMergeDialogOpen(false);
    setSelectedIncidents([]);
    refetch();
  };

  if (isLoading) {
    return <IncidentsSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load incidents"
        description={error?.userMessage || 'Unable to fetch incidents from the server'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Incident Management</h1>
          <p className="text-sm text-text-muted mt-1">View, filter, and manage all emergency incidents</p>
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
              <Label htmlFor="search" className="sr-only">Search incidents</Label>
              <Input
                id="search"
                placeholder="Search incidents..."
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
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.severity} onValueChange={(v) => handleFilterChange('severity', v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.incident_type} onValueChange={(v) => handleFilterChange('incident_type', v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Incident Type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedIncidents.length === filteredIncidents.length && filteredIncidents.length > 0}
                      indeterminate={selectedIncidents.length > 0 && selectedIncidents.length < filteredIncidents.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">
                      Incident ID
                      {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => handleSort('incident_type')}>
                    <div className="flex items-center gap-1">
                      Type
                      {sortConfig.key === 'incident_type' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('severity')}>
                    <div className="flex items-center gap-1">
                      Severity
                      {sortConfig.key === 'severity' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      Status
                      {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hidden lg:table-cell" onClick={() => handleSort('reported_at')}>
                    <div className="flex items-center gap-1">
                      Reported
                      {sortConfig.key === 'reported_at' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                    </div>
                  </TableHead>
                  <TableHead className="w-48">Location</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <EmptyState
                        icon={AlertTriangle}
                        title="No incidents found"
                        description="Try adjusting your filters or search terms"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncidents.map((incident) => (
                    <TableRow key={incident.id} className={cn(selectedIncidents.includes(incident.id) && 'bg-primary-light/50')}>
                      <TableCell className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIncidents.includes(incident.id)}
                          onChange={(e) => handleSelectOne(incident.id, e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={incident.severity} />
                          <span className="font-mono text-sm text-text-primary">{incident.id.slice(0, 12)}...</span>
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
                      <TableCell className="hidden lg:table-cell p-3">
                        <span className="text-sm text-text-secondary whitespace-nowrap">
                          {formatRelativeTime(incident.reported_at)}
                        </span>
                      </TableCell>
                      <TableCell className="p-3">
                        <span className="text-sm text-text-muted truncate max-w-[150px] block">
                          {incident.address || `${incident.location_lat?.toFixed(4)}, ${incident.location_lng?.toFixed(4)}`}
                        </span>
                      </TableCell>
                      <TableCell className="p-3">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {selectedIncidents.length > 0 && (
            <div className="mt-4 p-4 bg-primary-light border border-primary rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">
                  {selectedIncidents.length} incident(s) selected
                </span>
                <Button variant="outline" size="sm" onClick={() => openMergeDialog(selectedIncidents[0])}>
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Merge into first selected
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Incidents</DialogTitle>
            <DialogDescription>
              Selected incidents will be merged into the master incident (first selected). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleMerge} disabled={mergeMutation.isPending}>
              {mergeMutation.isPending ? 'Merging...' : 'Confirm Merge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IncidentsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><Skeleton variant="text" width="30%" className="h-6" /><Skeleton variant="text" width="50%" className="h-4 mt-1" /></div>
      </div>
      <Card><CardContent className="p-4 pt-6"><div className="flex flex-col sm:flex-row gap-4 mb-4">{[1,2,3,4].map(i => <Skeleton key={i} variant="rectangular" height="42" width="200px" />)}</div><TableSkeleton rows={5} columns={8} /></CardContent></Card>
    </div>
  );
}
import * as React from 'react';
import { useResources } from '../hooks';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/Card';
import { StatusBadge, ResourceTypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { ScrollArea } from '../components/ui/ScrollArea';
import { Input } from '../components/ui/Input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/Select';
import { EmptyState, TableSkeleton, Skeleton } from '../components/ui/States';
import {
  Search,
  Truck,
  RefreshCw,
  MapPin,
  Phone,
  Users,
} from 'lucide-react';

const resourceTypeOptions = [
  { value: 'ambulance', label: 'Ambulance' },
  { value: 'fire_truck', label: 'Fire Truck' },
  { value: 'police_unit', label: 'Police Unit' },
  { value: 'rescue_team', label: 'Rescue Team' },
  { value: 'medical_team', label: 'Medical Team' },
  { value: 'helicopter', label: 'Helicopter' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'facility', label: 'Facility' },
];

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'unavailable', label: 'Unavailable' },
];

export function ResourcesPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const { data: resources = [], isLoading, isError, error, refetch } = useResources({
    search: searchQuery,
    resource_type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const filteredResources = React.useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch = !searchQuery ||
        resource.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || resource.resource_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || resource.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [resources, searchQuery, typeFilter, statusFilter]);

  const availableCount = resources.filter(r => r.status === 'available').length;
  const dispatchedCount = resources.filter(r => r.status === 'dispatched').length;
  const maintenanceCount = resources.filter(r => r.status === 'maintenance').length;

  if (isLoading) {
    return <ResourcesSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-page-title text-text-primary">Resources</h1>
            <p className="text-secondary text-text-muted mt-0.5">Manage and monitor emergency response resources</p>
          </div>
        </div>
        <ErrorState
          title="Failed to load resources"
          description={error?.userMessage || 'Unable to connect to the server'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-page-title text-text-primary">Resources</h1>
          <p className="text-secondary text-text-muted mt-0.5">Manage and monitor emergency response resources</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Resources" value={resources.length} icon={Truck} iconColor="bg-primary-light text-primary" />
        <StatCard title="Available" value={availableCount} icon={Truck} iconColor="bg-severity-low-light text-severity-low" />
        <StatCard title="Dispatched" value={dispatchedCount} icon={Truck} iconColor="bg-severity-medium-light text-severity-medium" />
        <StatCard title="Maintenance" value={maintenanceCount} icon={Truck} iconColor="bg-severity-high-light text-severity-high" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm">Resource Directory</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {resourceTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredResources.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No resources found"
              description={searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'No resources have been added yet.'}
              className="py-10"
            />
          ) : (
            <ScrollArea className="max-h-[560px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-20">Capacity</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead className="w-52">Contact</TableHead>
                    <TableHead className="w-36">Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="p-2.5">
                        <div className="font-medium text-text-primary truncate max-w-xs">{resource.name}</div>
                        <div className="text-xs text-text-muted truncate max-w-xs mt-0.5 font-mono">
                          {resource.id.slice(0, 12)}...
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2.5">
                        <ResourceTypeBadge type={resource.resource_type} />
                      </TableCell>
                      <TableCell className="p-2.5">
                        <StatusBadge status={resource.status} type="resource" />
                      </TableCell>
                      <TableCell className="p-2.5">
                        <div className="flex items-center gap-1 text-sm text-text-secondary tabular-nums">
                          <Users className="h-3.5 w-3.5" />
                          {resource.capacity}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-2.5">
                        <div className="flex items-center gap-1 text-sm text-text-muted">
                          <MapPin className="h-3.5 w-3.5" />
                          {resource.location_lat?.toFixed(4)}, {resource.location_lng?.toFixed(4)}
                        </div>
                      </TableCell>
                      <TableCell className="p-2.5">
                        <div className="flex items-center gap-1 text-sm text-text-secondary truncate max-w-[180px]">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          {resource.contact}
                        </div>
                      </TableCell>
                      <TableCell className="p-2.5">
                        <span className="text-sm text-text-secondary whitespace-nowrap">
                          {formatDate(resource.created_at)}
                        </span>
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
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-stat text-text-primary mt-0.5">{value}</p>
          </div>
          <div className={cn('p-2.5 rounded-lg flex-shrink-0', iconColor)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResourcesSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton variant="text" width="40%" className="mb-2" /><Skeleton variant="text" width="60%" /></CardContent></Card>
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
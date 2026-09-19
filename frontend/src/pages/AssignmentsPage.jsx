import * as React from 'react';
import { useMemo, useState } from 'react';

import {
  useAllAssignments,
  useUpdateAssignmentStatus,
} from '../hooks';

import { formatRelativeTime, cn } from '../lib/utils';

import {
  Card,
  CardContent,
} from '../components/ui/Card';

import {
  Badge,
  SeverityBadge,
  StatusBadge,
  ResourceTypeBadge,
} from '../components/ui/Badge';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../components/ui/Select';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog';

import {
  RefreshCw,
  Truck,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

import {
  EmptyState,
  ErrorState,
  TableSkeleton,
  Skeleton,
} from '../components/ui/States';


/* -------------------------------------------------------------------------- */
/* STATUS OPTIONS                                                             */
/* -------------------------------------------------------------------------- */

const assignmentStatusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'en_route', label: 'En Route' },
  { value: 'on_scene', label: 'On Scene' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const assignmentStatusOrder = [
  'assigned',
  'en_route',
  'on_scene',
  'completed',
  'cancelled',
];


/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export function AssignmentsPage() {
  const [filters, setFilters] = useState({
    status: '',
    incident_id: '',
    search: '',
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'assigned_at',
    direction: 'desc',
  });

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAllAssignments(filters);

  const updateAssignmentStatus = useUpdateAssignmentStatus();


  /* ------------------------------------------------------------------------ */
  /* FILTERS                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };


  /* ------------------------------------------------------------------------ */
  /* SORTING                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === 'asc'
          ? 'desc'
          : 'asc',
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
        bVal = bVal?.toLowerCase?.() ?? '';
      }

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }

      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }, [assignments, sortConfig]);


  /* ------------------------------------------------------------------------ */
  /* FILTERED DATA                                                            */
  /* ------------------------------------------------------------------------ */

  const filteredAssignments = useMemo(() => {
    let result = sortedAssignments;

    if (filters.status) {
      result = result.filter(
        (assignment) => assignment.status === filters.status
      );
    }

    if (filters.incident_id) {
      result = result.filter(
        (assignment) =>
          assignment.incident_id === filters.incident_id
      );
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();

      result = result.filter(
        (assignment) =>
          assignment.id?.toLowerCase().includes(search) ||
          assignment.resource_name
            ?.toLowerCase()
            .includes(search) ||
          assignment.resource_type
            ?.toLowerCase()
            .includes(search) ||
          assignment.incident?.incident_type
            ?.toLowerCase()
            .includes(search) ||
          assignment.incident?.id
            ?.toLowerCase()
            .includes(search)
      );
    }

    return result;
  }, [sortedAssignments, filters]);


  /* ------------------------------------------------------------------------ */
  /* STATUS DIALOG                                                            */
  /* ------------------------------------------------------------------------ */

  const openStatusDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setStatusDialogOpen(true);
  };


  const handleStatusUpdate = async (newStatus) => {
    if (!selectedAssignment) return;

    try {
      await updateAssignmentStatus.mutateAsync({
        id: selectedAssignment.id,
        status: newStatus,
      });

      setStatusDialogOpen(false);
      setSelectedAssignment(null);
    } catch (err) {
      console.error(
        'Failed to update assignment status:',
        err
      );
    }
  };


  /* ------------------------------------------------------------------------ */
  /* LOADING                                                                  */
  /* ------------------------------------------------------------------------ */

  if (isLoading) {
    return <AssignmentsSkeleton />;
  }


  /* ------------------------------------------------------------------------ */
  /* ERROR                                                                    */
  /* ------------------------------------------------------------------------ */

  if (isError) {
    return (
      <ErrorState
        title="Failed to load assignments"
        description={
          error?.userMessage ||
          'Unable to fetch assignments from the server'
        }
        onRetry={() => refetch()}
      />
    );
  }


  /* ------------------------------------------------------------------------ */
  /* PAGE                                                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER                                                        */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <div className="flex items-center gap-3">
            

            <div>
              <h1 className="text-page-title text-text-primary">
                Resource Assignments
              </h1>

              <p className="text-secondary text-text-muted mt-0.5">
                Track and manage all resource assignments across incidents
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="self-start sm:self-auto bg-[#fffefa]"
        >
          <RefreshCw
            className={cn(
              'h-4 w-4',
              isLoading && 'animate-spin'
            )}
          />
          Refresh
        </Button>
      </div>


      {/* ------------------------------------------------------------------ */}
      {/* MAIN CARD                                                          */}
      {/* ------------------------------------------------------------------ */}

      <Card className="overflow-hidden border-[#deded8] bg-[#fffefa] shadow-[0_2px_8px_rgba(30,40,50,0.04)]">

        {/* -------------------------------------------------------------- */}
        {/* FILTER BAR                                                     */}
        {/* -------------------------------------------------------------- */}

        <CardContent className="p-0">

          <div className="border-b border-[#e5e3dc] bg-[#faf9f5] px-5 py-4">

            <div className="mb-3 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#6f7882]" />

              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#737a80]">
                Assignment filters
              </span>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row">

              {/* Search */}
              <div className="min-w-[240px] flex-1">
                <Label
                  htmlFor="search"
                  className="sr-only"
                >
                  Search assignments
                </Label>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b9298]" />

                  <Input
                    id="search"
                    placeholder="Search assignments..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange(
                        'search',
                        e.target.value
                      )
                    }
                    className="h-10 border-[#dcdedb] bg-white pl-9 shadow-none focus:border-[#315f89]"
                  />
                </div>
              </div>


              {/* Status */}
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  handleFilterChange(
                    'status',
                    value
                  )
                }
              >
                <SelectTrigger className="h-10 w-full border-[#dcdedb] bg-white shadow-none sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  {assignmentStatusOptions.map(
                    (option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>


              {/* Incident */}
              <Select
                value={filters.incident_id}
                onValueChange={(value) =>
                  handleFilterChange(
                    'incident_id',
                    value
                  )
                }
              >
                <SelectTrigger className="h-10 w-full border-[#dcdedb] bg-white shadow-none sm:w-[220px]">
                  <SelectValue placeholder="Incident" />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="">
                    All Incidents
                  </SelectItem>

                  {(() => {
                    const seen = new Set();

                    return assignments
                      .filter(
                        (assignment) =>
                          assignment.incident?.id &&
                          !seen.has(
                            assignment.incident.id
                          ) &&
                          seen.add(
                            assignment.incident.id
                          )
                      )
                      .map((assignment) => (
                        <SelectItem
                          key={
                            assignment.incident.id
                          }
                          value={
                            assignment.incident.id
                          }
                        >
                          <div className="flex flex-col">
                            <span className="font-medium capitalize">
                              {assignment.incident.incident_type
                                ?.replace(
                                  '_',
                                  ' '
                                )}
                            </span>

                            <span className="font-mono text-xs text-text-muted">
                              {assignment.incident.id.slice(
                                0,
                                12
                              )}
                              ...
                            </span>
                          </div>
                        </SelectItem>
                      ));
                  })()}

                </SelectContent>
              </Select>

            </div>
          </div>


          {/* -------------------------------------------------------------- */}
          {/* TABLE                                                          */}
          {/* -------------------------------------------------------------- */}

          <div
            className="
              max-h-[560px]
              w-full
              overflow-x-auto
              overflow-y-auto
              scrollbar-thin
              scrollbar-thumb-[#b7bdc2]
              scrollbar-track-[#f1f2ef]
            "
          >

            <Table className="min-w-[1320px]">

              <TableHeader className="sticky top-0 z-20 bg-[#f8f8f5]">

                <TableRow className="border-b border-[#dfe1dd] hover:bg-[#f8f8f5]">

                  {/* Assignment */}
                  <TableHead
                    className="h-12 w-[150px] cursor-pointer px-4 text-[11px] font-semibold tracking-[0.1em] text-[#727980]"
                    onClick={() =>
                      handleSort('id')
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      Assignment ID

                      {sortConfig.key === 'id' &&
                        (
                          sortConfig.direction ===
                          'asc'
                            ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            )
                            : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                        )}
                    </div>
                  </TableHead>


                  {/* Resource */}
                  <TableHead className="h-12 w-[260px] px-4 text-[11px] font-semibold tracking-[0.1em] text-[#727980]">
                    Resource
                  </TableHead>


                  {/* Type */}
                  <TableHead className="h-12 w-[130px] px-4 text-[11px] font-semibold tracking-[0.1em] text-[#727980]">
                    Type
                  </TableHead>


                  {/* Status */}
                  <TableHead
                    className="h-12 w-[130px] cursor-pointer px-4 text-[11px] font-semibold tracking-[0.1em] text-[#727980]"
                    onClick={() =>
                      handleSort('status')
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      Status

                      {sortConfig.key ===
                        'status' &&
                        (
                          sortConfig.direction ===
                          'asc'
                            ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            )
                            : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                        )}
                    </div>
                  </TableHead>


                  {/* Incident */}
                  <TableHead className="h-12 w-[220px] px-4 text-[11px] font-semibold tracking-[0.1em] text-[#727980]">
                    Incident
                  </TableHead>


                  {/* Incident Type */}
                  <TableHead className="h-12 w-[180px] px-4 text-[11px] font-semibold tracking-[0.1em] text-[#727980]">
                    Incident Type
                  </TableHead>


                  {/* Severity */}
                  <TableHead className="h-12 w-[110px] px-4 text-[11px] font-semibold tracking-[0.1em] text-[#727980]">
                    Severity
                  </TableHead>


                  {/* ETA */}
                  <TableHead className="h-12 w-[100px] px-4 text-[11px] font-semibold tracking-[0.1em] text-[#727980]">
                    ETA
                  </TableHead>


                  {/* Assigned */}
                  <TableHead
                    className="h-12 w-[120px] cursor-pointer px-4 text-[11px] font-semibold tracking-[0.1em] text-[#727980]"
                    onClick={() =>
                      handleSort('assigned_at')
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      Assigned

                      {sortConfig.key ===
                        'assigned_at' &&
                        (
                          sortConfig.direction ===
                          'asc'
                            ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            )
                            : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                        )}
                    </div>
                  </TableHead>


                  {/* Actions */}
                  <TableHead className="h-12 w-[130px] px-4 text-[11px] font-semibold tracking-[0.1em] text-[#727980]">
                    Actions
                  </TableHead>

                </TableRow>

              </TableHeader>


              <TableBody>

                {filteredAssignments.length === 0 ? (

                  <TableRow>

                    <TableCell
                      colSpan={10}
                      className="py-16 text-center"
                    >
                      <EmptyState
                        icon={Truck}
                        title="No assignments found"
                        description="Try adjusting your filters or search terms"
                      />
                    </TableCell>

                  </TableRow>

                ) : (

                  filteredAssignments.map(
                    (assignment) => (

                      <TableRow
                        key={assignment.id}
                        className="
                          h-[86px]
                          border-b
                          border-[#e7e6e1]
                          bg-[#fffefa]
                          hover:bg-[#f7f8f6]
                        "
                      >

                        {/* Assignment ID */}
                        <TableCell className="px-4 py-3">

                          <span
                            className="
                              font-mono
                              text-[13px]
                              font-medium
                              text-[#27313a]
                            "
                          >
                            {assignment.id.slice(
                              0,
                              12
                            )}
                            ...
                          </span>

                        </TableCell>


                        {/* Resource */}
                        <TableCell className="px-4 py-3">

                          <div className="flex min-w-0 flex-col gap-1.5">

                            <div className="flex items-center gap-2">

                              {assignment.resource_type && (
                                <ResourceTypeBadge
                                  type={
                                    assignment.resource_type
                                  }
                                />
                              )}

                              <span className="truncate font-semibold text-[#27313a]">
                                {assignment.resource_name ||
                                  assignment.resource_id ||
                                  'Unknown'}
                              </span>

                            </div>


                            {assignment.resource_contact && (
                              <span className="flex items-center gap-1.5 truncate text-xs text-[#7b8288]">

                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#9aa1a5]" />

                                {assignment.resource_contact}

                              </span>
                            )}

                          </div>

                        </TableCell>


                        {/* Type */}
                        <TableCell className="px-4 py-3">

                          <Badge
                            variant="outline"
                            className="
                              whitespace-nowrap
                              border-[#d9dcd8]
                              bg-[#fafbf9]
                              text-xs
                            "
                          >
                            {assignment.resource_type
                              ?.replace(
                                '_',
                                ' '
                              )
                              .replace(
                                /\b\w/g,
                                (c) =>
                                  c.toUpperCase()
                              ) ||
                              'Unknown'}
                          </Badge>

                        </TableCell>


                        {/* Status */}
                        <TableCell className="px-4 py-3">

                          <StatusBadge
                            status={
                              assignment.status
                            }
                            type="assignment"
                          />

                        </TableCell>


                        {/* Incident */}
                        <TableCell className="px-4 py-3">

                          <div className="min-w-0">

                            <div className="truncate font-mono text-xs font-medium text-[#303940]">
                              {assignment.incident?.id
                                ?.slice(
                                  0,
                                  12
                                )}
                              ...
                            </div>

                            <div className="mt-1 max-w-[190px] truncate text-xs text-[#7b8288]">
                              {assignment.incident
                                ?.description ||
                                'No description'}
                            </div>

                          </div>

                        </TableCell>


                        {/* Incident Type */}
                        <TableCell className="px-4 py-3">

                          <Badge
                            variant="outline"
                            className="
                              max-w-[170px]
                              whitespace-normal
                              border-[#d9dcd8]
                              bg-[#fafbf9]
                              text-xs
                              capitalize
                            "
                          >
                            {assignment.incident
                              ?.incident_type
                              ?.replace(
                                '_',
                                ' '
                              ) ||
                              'Unknown'}
                          </Badge>

                        </TableCell>


                        {/* Severity */}
                        <TableCell className="px-4 py-3">

                          {assignment.incident
                            ?.severity && (
                            <SeverityBadge
                              severity={
                                assignment.incident
                                  .severity
                              }
                            />
                          )}

                        </TableCell>


                        {/* ETA */}
                        <TableCell className="px-4 py-3">

                          {assignment.eta_minutes ? (

                            <span className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium tabular-nums text-[#555f67]">

                              <Clock className="h-3.5 w-3.5 text-[#7b858c]" />

                              {assignment.eta_minutes}{' '}
                              min

                            </span>

                          ) : (

                            <span className="text-[#9ca2a6]">
                              —
                            </span>

                          )}

                        </TableCell>


                        {/* Assigned */}
                        <TableCell className="px-4 py-3">

                          <span className="whitespace-nowrap text-sm tabular-nums text-[#667078]">
                            {formatRelativeTime(
                              assignment.assigned_at
                            )}
                          </span>

                        </TableCell>


                        {/* Actions */}
                        <TableCell className="px-4 py-3">

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openStatusDialog(
                                assignment
                              )
                            }
                            disabled={
                              updateAssignmentStatus.isPending
                            }
                            className="
                              h-9
                              whitespace-nowrap
                              border-[#d5d9d6]
                              bg-white
                              px-3
                              text-xs
                              font-medium
                              hover:border-[#315f89]
                              hover:bg-[#f2f6f9]
                            "
                          >
                            Update Status
                          </Button>

                        </TableCell>

                      </TableRow>

                    )
                  )

                )}

              </TableBody>

            </Table>

          </div>


          {/* -------------------------------------------------------------- */}
          {/* TABLE FOOTER                                                   */}
          {/* -------------------------------------------------------------- */}

          {filteredAssignments.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#e5e3dc] bg-[#faf9f5] px-5 py-3">

              <span className="text-xs text-[#7a8187]">
                Showing{' '}
                <span className="font-semibold text-[#4d555c]">
                  {filteredAssignments.length}
                </span>{' '}
                assignment
                {filteredAssignments.length !== 1
                  ? 's'
                  : ''}
              </span>

              <span className="hidden text-[11px] uppercase tracking-[0.08em] text-[#9a9fa3] sm:block">
                Scroll horizontally to view all columns
              </span>

            </div>
          )}

        </CardContent>

      </Card>


      {/* ------------------------------------------------------------------ */}
      {/* STATUS DIALOG                                                     */}
      {/* ------------------------------------------------------------------ */}

      <StatusUpdateDialog
        open={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
          setSelectedAssignment(null);
        }}
        assignment={selectedAssignment}
        onConfirm={handleStatusUpdate}
        isPending={
          updateAssignmentStatus.isPending
        }
      />

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* STATUS UPDATE DIALOG                                                       */
/* -------------------------------------------------------------------------- */

function StatusUpdateDialog({
  open,
  onClose,
  assignment,
  onConfirm,
  isPending,
}) {
  const [
    selectedStatus,
    setSelectedStatus,
  ] = React.useState(
    assignment?.status || 'assigned'
  );

  if (!open || !assignment) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
    >

      <DialogContent className="max-w-md overflow-hidden border-[#dfe1dd] bg-[#fffefa]">

        <DialogHeader>

          <DialogTitle className="text-lg">
            Update Assignment Status
          </DialogTitle>

          <DialogDescription className="space-y-1.5 text-sm">

            <div>
              Current status:{' '}
              <strong className="text-text-primary">
                {assignment.status
                  .replace(
                    '_',
                    ' '
                  )
                  .replace(
                    /\b\w/g,
                    (c) =>
                      c.toUpperCase()
                  )}
              </strong>
            </div>

            <div>
              Resource:{' '}
              <span className="text-text-primary">
                {assignment.resource_name ||
                  assignment.resource_id}
              </span>
            </div>

            <div>
              Incident:{' '}
              <span className="font-mono text-xs text-text-primary">
                {assignment.incident?.id?.slice(
                  0,
                  12
                )}
                ...
              </span>
            </div>

          </DialogDescription>

        </DialogHeader>


        <div className="grid grid-cols-2 gap-2.5 py-4">

          {assignmentStatusOrder.map(
            (status) => (

              <button
                key={status}
                type="button"
                onClick={() =>
                  setSelectedStatus(
                    status
                  )
                }
                disabled={
                  status ===
                  assignment.status
                }
                className={cn(
                  `
                    min-h-[58px]
                    rounded-xl
                    border
                    px-3
                    text-sm
                    font-medium
                    capitalize
                    transition-all
                  `,
                  selectedStatus ===
                    status
                    ? `
                      border-[#315f89]
                      bg-[#edf4f8]
                      text-[#244f75]
                      shadow-sm
                    `
                    : `
                      border-[#dfe1dd]
                      bg-[#faf9f5]
                      text-[#4d565d]
                      hover:border-[#9aabb9]
                      hover:bg-[#f3f5f3]
                    `,
                  status ===
                    assignment.status &&
                    `
                      cursor-not-allowed
                      opacity-45
                    `
                )}
              >
                {status.replace(
                  '_',
                  ' '
                )}
              </button>

            )
          )}

        </div>


        <DialogFooter className="border-t border-[#e5e3dc] pt-4">

          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button
            variant="default"
            onClick={() => {
              onConfirm(
                selectedStatus
              );
              onClose();
            }}
            disabled={
              isPending ||
              selectedStatus ===
                assignment?.status
            }
          >
            {isPending
              ? 'Updating...'
              : 'Confirm Update'}
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  );
}


/* -------------------------------------------------------------------------- */
/* SKELETON                                                                    */
/* -------------------------------------------------------------------------- */

function AssignmentsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <Skeleton
            variant="text"
            width="260px"
            className="h-7"
          />

          <Skeleton
            variant="text"
            width="390px"
            className="mt-2 h-4"
          />
        </div>

        <Skeleton
          variant="rectangular"
          height="38"
          width="90px"
        />

      </div>


      <Card className="overflow-hidden">

        <CardContent className="p-0">

          <div className="border-b border-[#e5e3dc] bg-[#faf9f5] p-5">

            <div className="mb-3">
              <Skeleton
                variant="text"
                width="150px"
                className="h-4"
              />
            </div>

            <div className="flex gap-3">

              <Skeleton
                variant="rectangular"
                height="40"
                width="100%"
              />

              <Skeleton
                variant="rectangular"
                height="40"
                width="180px"
              />

              <Skeleton
                variant="rectangular"
                height="40"
                width="220px"
              />

            </div>

          </div>


          <div className="overflow-hidden p-4">

            <TableSkeleton
              rows={6}
              columns={10}
            />

          </div>

        </CardContent>

      </Card>

    </div>
  );
}
import * as React from 'react';

import {
  useDashboardOverview,
  useDashboardAlerts,
  useAcknowledgeAlert,
  useAssignmentsForIncidents,
  useIncidentSummary,
} from '../hooks';

import {
  formatRelativeTime,
  formatDate,
} from '../lib/utils';

import { cn } from '../lib/utils';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '../components/ui/Card';

import {
  Badge,
  SeverityBadge,
  StatusBadge,
  ResourceTypeBadge,
} from '../components/ui/Badge';

import { Button } from '../components/ui/Button';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

import { Separator } from '../components/ui/Separator';

import {
  AlertTriangle,
  MapPin,
  Users,
  Clock,
  Activity,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Truck,
  AlertCircle,
  FileText,
  Shield,
} from 'lucide-react';

import { DashboardMap } from './components/DashboardMap';
import { AlertsPanel } from './components/AlertsPanel';

import {
  ErrorState,
  EmptyState,
  TableSkeleton,
  Skeleton,
} from '../components/ui/States';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog';

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../components/ui/Tabs';

import { Label } from '../components/ui/Label';


/* =========================================================
   CONSTANTS
========================================================= */

const severityOrder = [
  'critical',
  'high',
  'medium',
  'low',
];

const severityLabels = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};


/* =========================================================
   DASHBOARD PAGE
========================================================= */

export function DashboardPage() {
  const {
    data: overview,
    isLoading,
    isError,
    error,
    refetch,
    fetchStatus,
  } = useDashboardOverview();

  const {
    data: alerts = [],
    isLoading: alertsLoading,
  } = useDashboardAlerts('active');

  const acknowledgeAlert = useAcknowledgeAlert();

  const [
    selectedIncident,
    setSelectedIncident,
  ] = React.useState(null);

  const [
    detailOpen,
    setDetailOpen,
  ] = React.useState(false);

  const incidentIds = React.useMemo(
    () =>
      (overview?.incidents || []).map(
        (incident) => incident.id
      ),
    [overview?.incidents]
  );

  const {
    data: assignmentsByIncident = {},
    isLoading: assignmentsLoading,
  } = useAssignmentsForIncidents(incidentIds);

  const {
    data: incidentSummary,
    isLoading: summaryLoading,
  } = useIncidentSummary(
    selectedIncident?.id
  );


  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading) {
    return <DashboardSkeleton />;
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (isError) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        description={
          error?.userMessage ||
          'Unable to connect to the server'
        }
        onRetry={() => refetch()}
      />
    );
  }


  /* =======================================================
     DATA
  ======================================================= */

  const activeEmergencies =
    overview?.active_emergencies || 0;

  const severityBreakdown =
    overview?.severity_breakdown || {};

  const statusBreakdown =
    overview?.status_breakdown || {};

  const incidentsWithTeams =
    overview?.incidents_with_teams_assigned || 0;

  const incidents =
    overview?.incidents || [];

  const criticalCount =
    severityBreakdown.critical || 0;

  const highCount =
    severityBreakdown.high || 0;

  const requiringResponse =
    criticalCount + highCount;


  /* =======================================================
     INCIDENT SELECT
  ======================================================= */

  const handleRowClick = (incident) => {
    setSelectedIncident(incident);
    setDetailOpen(true);
  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <div>
          <h1 className="text-page-title text-text-primary">
            Operations Dashboard
          </h1>

          <p className="text-secondary text-text-muted mt-0.5">
            Real-time emergency response monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={
              isLoading ||
              fetchStatus === 'fetching'
            }
          >
            <RefreshCw
              className={cn(
                'h-4 w-4',
                (
                  isLoading ||
                  fetchStatus === 'fetching'
                ) &&
                  'animate-spin'
              )}
            />

            Refresh
          </Button>

        </div>

      </div>


      {/* ===================================================
          STAT CARDS
      =================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        <StatCard
          title="Active Emergencies"
          value={activeEmergencies}
          subtext={
            activeEmergencies > 0
              ? `${requiringResponse} requiring response`
              : 'All clear'
          }
          icon={AlertTriangle}
          iconColor="bg-severity-critical-light text-severity-critical"
        />

        <StatCard
          title="Critical Severity"
          value={criticalCount}
          icon={AlertTriangle}
          iconColor="bg-severity-critical-light text-severity-critical"
        />

        <StatCard
          title="Resources Deployed"
          value={incidentsWithTeams}
          subtext={`${incidentsWithTeams} of ${activeEmergencies} incidents`}
          icon={Users}
          iconColor="bg-primary-light text-primary"
        />

        <StatCard
          title="Active Alerts"
          value={alerts.length}
          subtext={
            alerts.length > 0
              ? 'Requires attention'
              : 'No active alerts'
          }
          icon={Activity}
          iconColor="bg-severity-high-light text-severity-high"
        />

      </div>


      {/* ===================================================
          MAIN DASHBOARD GRID
      =================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div className="lg:col-span-2 space-y-4">

          <IncidentsTable
            incidents={incidents}
            assignmentsByIncident={
              assignmentsByIncident
            }
            assignmentsLoading={
              assignmentsLoading
            }
            onSelect={handleRowClick}
            selectedId={
              selectedIncident?.id
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <SeverityBreakdownCard
              breakdown={severityBreakdown}
              activeTotal={activeEmergencies}
            />

            <StatusBreakdownCard
              breakdown={statusBreakdown}
            />

          </div>

        </div>


        {/* =================================================
            RIGHT COLUMN
        ================================================= */}

        <div className="space-y-4">

          <DashboardMap
            incidents={incidents}
            selectedIncidentId={
              selectedIncident?.id
            }
            onSelect={handleRowClick}
          />

          <AlertsPanel
            alerts={alerts}
            isLoading={alertsLoading}
            onAcknowledge={(id) =>
              acknowledgeAlert.mutate(id)
            }
            isAcknowledging={
              acknowledgeAlert.isPending
            }
          />

        </div>

      </div>


      {/* ===================================================
          INCIDENT DETAIL
      =================================================== */}

      <IncidentDetailDialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedIncident(null);
        }}
        incident={selectedIncident}
        assignments={
          selectedIncident
            ? assignmentsByIncident[
                selectedIncident.id
              ]
            : []
        }
        assignmentsLoading={
          assignmentsLoading
        }
        summary={incidentSummary}
        summaryLoading={summaryLoading}
      />

    </div>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor,
}) {
  return (
    <Card>
      <CardContent className="p-4">

        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">

            <p className="text-sm font-medium text-text-secondary">
              {title}
            </p>

            <p className="text-stat text-text-primary mt-0.5">
              {value}
            </p>

            {subtext && (
              <p className="text-xs text-text-muted mt-1">
                {subtext}
              </p>
            )}

          </div>

          <div
            className={cn(
              'p-2.5 rounded-lg flex-shrink-0',
              iconColor
            )}
          >
            <Icon
              className="h-5 w-5"
              aria-hidden="true"
            />
          </div>

        </div>

      </CardContent>
    </Card>
  );
}


/* =========================================================
   SEVERITY BREAKDOWN
========================================================= */

function SeverityBreakdownCard({
  breakdown,
  activeTotal,
}) {
  return (
    <Card>

      <CardHeader>
        <CardTitle className="text-sm">
          Severity Breakdown
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">

        <div className="space-y-2.5">

          {severityOrder.map(
            (severity) => {

              const count =
                breakdown[severity] || 0;

              const color =
                `var(--color-severity-${severity})`;

              const pct =
                activeTotal > 0
                  ? (count / activeTotal) * 100
                  : 0;

              return (
                <div
                  key={severity}
                  className="flex items-center justify-between gap-2"
                >

                  <div className="flex items-center gap-2 min-w-0">

                    <SeverityBadge
                      severity={severity}
                      showIcon
                    />

                    <span className="text-sm font-medium text-text-primary capitalize">
                      {severityLabels[severity]}
                    </span>

                  </div>

                  <div className="flex items-center gap-2 text-right flex-shrink-0">

                    <span className="text-lg font-bold text-text-primary tabular-nums">
                      {count}
                    </span>

                    <div className="h-1.5 w-20 bg-background-tertiary rounded-full overflow-hidden">

                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                        }}
                      />

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </CardContent>

    </Card>
  );
}


/* =========================================================
   STATUS BREAKDOWN
========================================================= */

function StatusBreakdownCard({
  breakdown,
}) {
  const statusOrder = [
    'reported',
    'verified',
    'dispatched',
    'in_progress',
    'resolved',
    'closed',
  ];

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
        <CardTitle className="text-sm">
          Status Breakdown
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">

        <div className="space-y-2.5">

          {statusOrder.map(
            (status) => {

              const count =
                breakdown[status] || 0;

              return (
                <div
                  key={status}
                  className="flex items-center justify-between gap-2"
                >

                  <div className="flex items-center gap-2">

                    <StatusBadge
                      status={status}
                    />

                    <span className="text-sm font-medium text-text-primary">
                      {statusLabels[status]}
                    </span>

                  </div>

                  <span className="text-lg font-bold text-text-primary tabular-nums">
                    {count}
                  </span>

                </div>
              );
            }
          )}

        </div>

      </CardContent>

    </Card>
  );
}


/* =========================================================
   ACTIVE INCIDENTS TABLE

   The CARD dimensions remain unchanged.

   Only the table's inner container scrolls:
   - horizontal
   - vertical

   The outer dashboard does not get horizontal scrolling.
========================================================= */

function IncidentsTable({
  incidents,
  assignmentsByIncident,
  assignmentsLoading,
  onSelect,
  selectedId,
}) {

  if (!incidents.length) {
    return (
      <Card>

        <CardContent className="py-8">

          <EmptyState
            icon={AlertTriangle}
            title="No active incidents"
            description="All emergencies have been resolved or there are no active reports at this time."
          />

        </CardContent>

      </Card>
    );
  }


  const sortedIncidents =
    [...incidents].sort((a, b) => {

      const aSeverityIndex =
        severityOrder.indexOf(a.severity);

      const bSeverityIndex =
        severityOrder.indexOf(b.severity);

      const severityDiff =
        (aSeverityIndex === -1 ? 99 : aSeverityIndex) -
        (bSeverityIndex === -1 ? 99 : bSeverityIndex);

      if (severityDiff !== 0) {
        return severityDiff;
      }

      return (
        new Date(b.reported_at) -
        new Date(a.reported_at)
      );
    });


  const getAssignmentStatus = (
    incidentId
  ) => {

    const assignments =
      assignmentsByIncident[
        incidentId
      ] || [];

    if (!assignments.length) {
      return null;
    }

    return assignments[0].status;
  };


  return (
    <Card className="w-full overflow-hidden">

      <CardHeader className="shrink-0">

        <div className="flex items-center justify-between gap-3">

          <CardTitle className="text-sm">
            Active Incidents
          </CardTitle>

          {assignmentsLoading && (
            <span className="text-xs text-text-muted flex items-center gap-1 shrink-0">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading assignments...
            </span>
          )}

        </div>

      </CardHeader>


      <CardContent className="pt-0 p-0">

        {/* BOTH HORIZONTAL + VERTICAL SCROLL */}
        <div
          className="
            w-full
            max-h-[480px]
            overflow-x-auto
            overflow-y-auto
            overscroll-contain
          "
        >

          <Table
            className="
              min-w-[980px]
              w-full
            "
          >

            <TableHeader>

              <TableRow>

                <TableHead className="w-[70px] min-w-[70px]">
                  Severity
                </TableHead>

                <TableHead className="min-w-[360px]">
                  Incident
                </TableHead>

                <TableHead className="min-w-[150px]">
                  Type
                </TableHead>

                <TableHead className="w-[110px] min-w-[110px]">
                  Severity
                </TableHead>

                <TableHead className="w-[120px] min-w-[120px]">
                  Status
                </TableHead>

                <TableHead className="w-[150px] min-w-[150px]">
                  Assignment
                </TableHead>

                <TableHead className="w-[130px] min-w-[130px]">
                  Reported
                </TableHead>

                <TableHead className="w-[180px] min-w-[180px]">
                  Location
                </TableHead>

              </TableRow>

            </TableHeader>


            <TableBody>

              {sortedIncidents.map(
                (incident) => {

                  const assignment =
                    getAssignmentStatus(
                      incident.id
                    );

                  return (
                    <TableRow
                      key={incident.id}
                      onClick={() =>
                        onSelect(incident)
                      }
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedId ===
                          incident.id &&
                          'bg-primary-light/50'
                      )}
                    >

                      {/* SEVERITY */}

                      <TableCell className="p-2.5">

                        <SeverityBadge
                          severity={
                            incident.severity
                          }
                        />

                      </TableCell>


                      {/* INCIDENT */}

                      <TableCell className="p-2.5">

                        <div className="min-w-0">

                          <div
                            className="
                              font-medium
                              text-text-primary
                              truncate
                              font-mono
                              text-sm
                              max-w-[340px]
                            "
                          >
                            {incident.id.slice(
                              0,
                              12
                            )}
                            ...
                          </div>

                          <div
                            className="
                              text-secondary
                              text-text-muted
                              truncate
                              max-w-[340px]
                              mt-0.5
                            "
                          >
                            {incident.description}
                          </div>

                        </div>

                      </TableCell>


                      {/* TYPE */}

                      <TableCell className="p-2.5">

                        <Badge
                          variant="outline"
                          className="
                            text-xs
                            whitespace-nowrap
                          "
                        >
                          {incident.incident_type
                            ?.replace(
                              /_/g,
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


                      {/* SEVERITY */}

                      <TableCell className="p-2.5">

                        <SeverityBadge
                          severity={
                            incident.severity
                          }
                        />

                      </TableCell>


                      {/* STATUS */}

                      <TableCell className="p-2.5">

                        <StatusBadge
                          status={
                            incident.status
                          }
                        />

                      </TableCell>


                      {/* ASSIGNMENT */}

                      <TableCell className="p-2.5">

                        {assignmentsLoading ? (

                          <Skeleton
                            variant="text"
                            width="70%"
                            height="20px"
                          />

                        ) : assignment ? (

                          <StatusBadge
                            status={
                              assignment
                            }
                            type="assignment"
                          />

                        ) : (

                          <Badge
                            variant="outline"
                            className="
                              text-xs
                              text-text-muted
                              whitespace-nowrap
                            "
                          >
                            Unassigned
                          </Badge>

                        )}

                      </TableCell>


                      {/* REPORTED */}

                      <TableCell className="p-2.5">

                        <span
                          className="
                            text-sm
                            text-text-secondary
                            whitespace-nowrap
                            tabular-nums
                          "
                        >
                          {formatRelativeTime(
                            incident.reported_at
                          )}
                        </span>

                      </TableCell>


                      {/* LOCATION */}

                      <TableCell className="p-2.5">

                        <span
                          className="
                            text-sm
                            text-text-muted
                            truncate
                            max-w-[160px]
                            block
                          "
                        >
                          {incident.address ||
                            `${
                              incident.location_lat?.toFixed(
                                4
                              )
                            }, ${
                              incident.location_lng?.toFixed(
                                4
                              )
                            }`}
                        </span>

                      </TableCell>

                    </TableRow>
                  );
                }
              )}

            </TableBody>

          </Table>

        </div>

      </CardContent>

    </Card>
  );
}


/* =========================================================
   INCIDENT DETAIL DIALOG

   IMPORTANT:
   The DialogContent component already provides the
   modal close button.

   Therefore there is NO additional DialogClose/X here.
========================================================= */

function IncidentDetailDialog({
  open,
  onClose,
  incident,
  assignments,
  assignmentsLoading,
  summary,
  summaryLoading,
}) {

  if (!incident) {
    return null;
  }


  const incidentType =
    incident.incident_type
      ?.replace(/_/g, ' ')
      .replace(
        /\b\w/g,
        (c) => c.toUpperCase()
      ) ||
    'Unknown Incident';


  const location =
    incident.address ||
    `${incident.location_lat?.toFixed(4)}, ${incident.location_lng?.toFixed(4)}`;


  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
    >

      <DialogContent
        className="
          w-[min(920px,calc(100vw-32px))]
          max-w-[920px]
          h-[min(760px,calc(100vh-40px))]
          max-h-[calc(100vh-40px)]
          p-0
          overflow-hidden
          flex
          flex-col
          rounded-xl
        "
      >

        {/* =================================================
            FIXED HEADER
        ================================================= */}

        <DialogHeader
          className="
            shrink-0
            px-7
            py-5
            border-b
            border-border
          "
        >

          <div className="flex items-start gap-4">

            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-2 mb-2 flex-wrap">

                <SeverityBadge
                  severity={
                    incident.severity
                  }
                  showIcon
                />

                <span
                  className="
                    font-mono
                    text-sm
                    text-text-primary
                    truncate
                    max-w-[260px]
                  "
                  title={incident.id}
                >
                  {incident.id.slice(
                    0,
                    12
                  )}
                  ...
                </span>

                <StatusBadge
                  status={
                    incident.status
                  }
                />

              </div>


              <DialogTitle
                className="
                  text-lg
                  font-semibold
                  text-text-primary
                  truncate
                "
              >
                {incidentType}
              </DialogTitle>


              <DialogDescription
                className="
                  text-sm
                  text-text-muted
                  mt-1
                  truncate
                "
              >
                {formatDate(
                  incident.reported_at
                )}

                {' · '}

                {location}
              </DialogDescription>

            </div>

          </div>

        </DialogHeader>


        {/* =================================================
            SCROLLABLE BODY

            Only this section scrolls vertically.
        ================================================= */}

        <div
          className="
            flex-1
            min-h-0
            overflow-y-auto
            overflow-x-hidden
            px-7
            py-5
          "
        >

          <Tabs
            defaultValue="overview"
            className="w-full"
          >

            <TabsList
              className="
                w-full
                grid
                grid-cols-3
                h-11
                p-1
                rounded-lg
                bg-background-tertiary
              "
            >

              <TabsTrigger value="overview">
                Overview
              </TabsTrigger>

              <TabsTrigger value="assignments">
                Assignments (
                {assignments?.length || 0}
                )
              </TabsTrigger>

              <TabsTrigger
                value="ai"
                disabled={summaryLoading}
              >
                AI Analysis
              </TabsTrigger>

            </TabsList>


            {/* =============================================
                OVERVIEW
            ============================================= */}

            <TabsContent
              value="overview"
              className="space-y-5 pt-4"
            >

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <DetailField
                  label="Incident ID"
                  value={incident.id}
                  monospace
                />

                <DetailField
                  label="Type"
                  value={incidentType}
                />

                <DetailField
                  label="Severity"
                  value={
                    <SeverityBadge
                      severity={
                        incident.severity
                      }
                    />
                  }
                />

                <DetailField
                  label="Status"
                  value={
                    <StatusBadge
                      status={
                        incident.status
                      }
                    />
                  }
                />

                <DetailField
                  label="Priority"
                  value={
                    incident.priority
                  }
                  monospace
                />

                <DetailField
                  label="Confidence"
                  value={
                    incident.confidence
                      ? `${Math.round(
                          incident.confidence *
                            100
                        )}%`
                      : 'N/A'
                  }
                />

                <DetailField
                  label="Report Count"
                  value={
                    incident.report_count ||
                    1
                  }
                />

                <DetailField
                  label="Source"
                  value={
                    incident.source
                      ?.replace(
                        /_/g,
                        ' '
                      )
                      .replace(
                        /\b\w/g,
                        (c) =>
                          c.toUpperCase()
                      ) ||
                    'Unknown'
                  }
                />

              </div>


              <Separator />


              <div>

                <Label
                  className="
                    text-sm
                    font-medium
                    text-text-secondary
                    mb-2
                    block
                  "
                >
                  Description
                </Label>

                <p
                  className="
                    text-body
                    text-text-primary
                    whitespace-pre-wrap
                    break-words
                  "
                >
                  {incident.description ||
                    'No description available.'}
                </p>

              </div>


              <div>

                <Label
                  className="
                    text-sm
                    font-medium
                    text-text-secondary
                    mb-2
                    block
                  "
                >
                  Location
                </Label>

                <div className="flex items-start gap-2 text-text-primary">

                  <MapPin
                    className="
                      h-4
                      w-4
                      mt-0.5
                      text-text-muted
                      flex-shrink-0
                    "
                  />

                  <div className="min-w-0">

                    <p className="break-words">
                      {incident.address ||
                        `${incident.location_lat?.toFixed(
                          6
                        )}, ${incident.location_lng?.toFixed(
                          6
                        )}`}
                    </p>

                    <p
                      className="
                        text-xs
                        text-text-muted
                        mt-1
                        font-mono
                      "
                    >
                      Lat:{' '}
                      {incident.location_lat?.toFixed(
                        6
                      )}

                      {', '}

                      Lng:{' '}
                      {incident.location_lng?.toFixed(
                        6
                      )}
                    </p>

                  </div>

                </div>

              </div>


              {incident.sla_deadline && (

                <div
                  className="
                    p-3
                    rounded-lg
                    bg-severity-high-light
                    border
                    border-severity-high
                  "
                >

                  <div className="flex items-center gap-2">

                    <Shield
                      className="
                        h-4
                        w-4
                        text-severity-high
                        shrink-0
                      "
                    />

                    <span
                      className="
                        text-sm
                        font-medium
                        text-severity-high-text
                      "
                    >
                      SLA Deadline:{' '}
                      {formatDate(
                        incident.sla_deadline
                      )}
                    </span>

                  </div>

                </div>

              )}

            </TabsContent>


            {/* =============================================
                ASSIGNMENTS
            ============================================= */}

            <TabsContent
              value="assignments"
              className="space-y-3 pt-4"
            >

              {assignmentsLoading ? (

                <div className="space-y-2">

                  {[1, 2].map(
                    (i) => (
                      <Skeleton
                        key={i}
                        variant="rectangular"
                        height="64"
                        width="100%"
                      />
                    )
                  )}

                </div>

              ) : assignments.length === 0 ? (

                <EmptyState
                  icon={Truck}
                  title="No resources assigned"
                  description="This incident has no resource assignments yet."
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClose();
                        window.location.href =
                          '/resources';
                      }}
                    >
                      <Truck className="h-3.5 w-3.5 mr-1" />
                      View Available Resources
                    </Button>
                  }
                  className="py-6"
                />

              ) : (

                <div className="space-y-2">

                  {assignments.map(
                    (assignment) => (

                      <Card
                        key={assignment.id}
                        className="p-3"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex-1 min-w-0">

                            <div
                              className="
                                flex
                                items-center
                                gap-2
                                mb-1
                                flex-wrap
                              "
                            >

                              {assignment.resource_type && (
                                <ResourceTypeBadge
                                  type={
                                    assignment.resource_type
                                  }
                                />
                              )}

                              <span
                                className="
                                  font-medium
                                  text-text-primary
                                  truncate
                                "
                              >
                                {assignment.resource_name ||
                                  assignment.resource_id ||
                                  'Unknown Resource'}
                              </span>

                              <StatusBadge
                                status={
                                  assignment.status
                                }
                                type="assignment"
                              />

                            </div>


                            <div
                              className="
                                flex
                                flex-wrap
                                gap-3
                                text-sm
                                text-text-secondary
                              "
                            >

                              {assignment.eta_minutes != null && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />

                                  ETA:{' '}
                                  {assignment.eta_minutes}{' '}
                                  min
                                </span>
                              )}

                              {assignment.resource_location_lat != null &&
                                assignment.resource_location_lng != null && (

                                  <span className="flex items-center gap-1">

                                    <MapPin className="h-3.5 w-3.5" />

                                    {assignment.resource_location_lat.toFixed(
                                      4
                                    )}

                                    ,{' '}

                                    {assignment.resource_location_lng.toFixed(
                                      4
                                    )}

                                  </span>

                                )}

                            </div>

                          </div>


                          <div
                            className="
                              text-right
                              text-sm
                              text-text-muted
                              shrink-0
                            "
                          >

                            <p>
                              Assigned:{' '}
                              {formatRelativeTime(
                                assignment.assigned_at
                              )}
                            </p>

                            <p className="font-mono">
                              {assignment.id.slice(
                                0,
                                8
                              )}
                              ...
                            </p>

                          </div>

                        </div>

                      </Card>

                    )
                  )}

                </div>

              )}

            </TabsContent>


            {/* =============================================
                AI ANALYSIS
            ============================================= */}

            <TabsContent
              value="ai"
              className="space-y-4 pt-4"
            >

              {summaryLoading ? (

                <div className="space-y-3">

                  <Skeleton
                    variant="rectangular"
                    height="100"
                    width="100%"
                  />

                  <Skeleton
                    variant="rectangular"
                    height="100"
                    width="100%"
                  />

                </div>

              ) : summary ? (

                <div className="space-y-5">

                  <div>

                    <Label
                      className="
                        text-sm
                        font-medium
                        text-text-secondary
                        mb-2
                        block
                        flex
                        items-center
                        gap-1
                      "
                    >
                      <FileText className="h-4 w-4" />
                      AI Summary
                    </Label>

                    <div
                      className="
                        p-4
                        rounded-lg
                        bg-background-tertiary
                        border
                        border-border
                      "
                    >

                      <p
                        className="
                          text-body
                          text-text-primary
                          whitespace-pre-wrap
                          break-words
                        "
                      >
                        {summary.summary}
                      </p>

                    </div>

                  </div>


                  {summary.recommendations && (

                    <div>

                      <Label
                        className="
                          text-sm
                          font-medium
                          text-text-secondary
                          mb-2
                          block
                          flex
                          items-center
                          gap-1
                        "
                      >
                        <AlertCircle className="h-4 w-4" />
                        AI Recommendations
                      </Label>

                      <div
                        className="
                          p-4
                          rounded-lg
                          bg-background-tertiary
                          border
                          border-border
                        "
                      >

                        <p
                          className="
                            text-body
                            text-text-primary
                            whitespace-pre-wrap
                            break-words
                          "
                        >
                          {summary.recommendations}
                        </p>

                      </div>

                    </div>

                  )}

                </div>

              ) : (

                <EmptyState
                  icon={FileText}
                  title="AI analysis not available"
                  description="AI summary and recommendations will be generated after incident classification."
                  className="py-6"
                />

              )}

            </TabsContent>

          </Tabs>

        </div>


        {/* =================================================
            FIXED FOOTER
        ================================================= */}

        <DialogFooter
          className="
            shrink-0
            px-7
            py-4
            border-t
            border-border
            bg-background
            flex
            justify-end
            gap-2
          "
        >

          <Button
            variant="outline"
            onClick={onClose}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>


          <Button
            variant="default"
            onClick={() => {
              onClose();
              window.location.href =
                `/incidents/${incident.id}`;
            }}
          >
            View Full Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  );
}


/* =========================================================
   DETAIL FIELD
========================================================= */

function DetailField({
  label,
  value,
  monospace,
}) {
  return (
    <div className="min-w-0">

      <Label
        className="
          text-xs
          font-medium
          text-text-muted
          uppercase
          tracking-wider
          mb-1
          block
        "
      >
        {label}
      </Label>

      <div
        className={cn(
          'text-sm text-text-primary min-w-0 break-words',
          monospace && 'font-mono'
        )}
      >
        {typeof value === 'object'
          ? value
          : value ?? '—'}
      </div>

    </div>
  );
}


/* =========================================================
   DASHBOARD SKELETON
========================================================= */

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">

      {/* STAT SKELETONS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {[1, 2, 3, 4].map(
          (i) => (

            <Card key={i}>

              <CardContent className="p-4">

                <Skeleton
                  variant="text"
                  width="40%"
                  className="mb-2"
                />

                <Skeleton
                  variant="text"
                  width="60%"
                />

              </CardContent>

            </Card>

          )
        )}

      </div>


      {/* MAIN SKELETON */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 space-y-4">

          <Card>

            <CardContent className="pt-0">

              <TableSkeleton
                rows={5}
                columns={8}
              />

            </CardContent>

          </Card>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <Card>

              <CardContent className="pt-0">

                <div className="space-y-2.5 p-5">

                  {[1, 2, 3, 4].map(
                    (i) => (

                      <Skeleton
                        key={i}
                        variant="rectangular"
                        height="24"
                        width="100%"
                      />

                    )
                  )}

                </div>

              </CardContent>

            </Card>


            <Card>

              <CardContent className="pt-0">

                <div className="space-y-2.5 p-5">

                  {[1, 2, 3, 4, 5, 6].map(
                    (i) => (

                      <Skeleton
                        key={i}
                        variant="rectangular"
                        height="24"
                        width="100%"
                      />

                    )
                  )}

                </div>

              </CardContent>

            </Card>

          </div>

        </div>


        {/* RIGHT COLUMN */}

        <div className="space-y-4">

          <Card>

            <CardContent className="pt-0">

              <Skeleton
                variant="rectangular"
                height="360"
                width="100%"
              />

            </CardContent>

          </Card>


          <Card>

            <CardContent className="pt-0">

              <div className="space-y-2.5 p-5">

                {[1, 2, 3].map(
                  (i) => (

                    <Skeleton
                      key={i}
                      variant="rectangular"
                      height="48"
                      width="100%"
                    />

                  )
                )}

              </div>

            </CardContent>

          </Card>

        </div>

      </div>

    </div>
  );
}
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
import { Separator } from '../../components/ui/Separator';

import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Bell,
  Loader2,
} from 'lucide-react';

import {
  EmptyState,
  Skeleton,
} from '../../components/ui/States';


/* =========================================================
   ALERT TYPE CONFIG
========================================================= */

const alertTypeConfig = {
  critical_incident: {
    label: 'Critical Incident',
    icon: AlertTriangle,
    color:
      'bg-severity-critical-light text-severity-critical',
    border:
      'border-severity-critical',
  },

  delayed_response: {
    label: 'Delayed Response',
    icon: Clock,
    color:
      'bg-severity-high-light text-severity-high',
    border:
      'border-severity-high',
  },

  escalation: {
    label: 'Escalation',
    icon: AlertTriangle,
    color:
      'bg-severity-high-light text-severity-high',
    border:
      'border-severity-high',
  },

  resource_shortage: {
    label: 'Resource Shortage',
    icon: AlertTriangle,
    color:
      'bg-severity-medium-light text-severity-medium',
    border:
      'border-severity-medium',
  },
};


/* =========================================================
   ALERT STATUS CONFIG
========================================================= */

const alertStatusConfig = {
  active: {
    label: 'Active',
    color:
      'bg-severity-critical-light text-severity-critical',
  },

  acknowledged: {
    label: 'Acknowledged',
    color:
      'bg-severity-high-light text-severity-high',
  },

  resolved: {
    label: 'Resolved',
    color:
      'bg-severity-low-light text-severity-low',
  },
};


/* =========================================================
   ALERTS PANEL
========================================================= */

export function AlertsPanel({
  alerts = [],
  isLoading,
  onAcknowledge,
  isAcknowledging,
}) {

  /* -------------------------------------------------------
     Loading
  ------------------------------------------------------- */

  if (isLoading) {
    return (
      <Card className="w-full overflow-hidden">

        <CardHeader className="shrink-0 pb-3">

          <CardTitle className="flex items-center gap-2 text-sm">

            <Bell className="h-4 w-4" />

            Active Alerts

          </CardTitle>

        </CardHeader>


        <CardContent className="pt-0">

          <div className="space-y-3">

            {[1, 2, 3].map((i) => (

              <Skeleton
                key={i}
                variant="rectangular"
                height="86"
                width="100%"
              />

            ))}

          </div>

        </CardContent>

      </Card>
    );
  }


  /* -------------------------------------------------------
     Separate active / acknowledged alerts
  ------------------------------------------------------- */

  const activeAlerts = alerts.filter(
    (alert) =>
      alert.status === 'active'
  );

  const acknowledgedAlerts =
    alerts.filter(
      (alert) =>
        alert.status === 'acknowledged'
    );


  /* -------------------------------------------------------
     Empty
  ------------------------------------------------------- */

  const isEmpty =
    activeAlerts.length === 0 &&
    acknowledgedAlerts.length === 0;


  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */

  return (
    <Card
      className="
        alerts-panel
        flex
        w-full
        min-w-0
        flex-col
        overflow-hidden
      "
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <CardHeader
        className="
          shrink-0
          border-b
          border-border
          px-4
          py-3
        "
      >

        <div className="flex items-center justify-between">

          <CardTitle
            className="
              flex
              items-center
              gap-2
              text-sm
              font-semibold
            "
          >

            <Bell className="h-4 w-4" />

            Active Alerts

            {activeAlerts.length > 0 && (

              <Badge
                variant="destructive"
                className="
                  h-5
                  min-w-5
                  justify-center
                  rounded-full
                  px-2
                  text-xs
                "
              >
                {activeAlerts.length}
              </Badge>

            )}

          </CardTitle>


          {isAcknowledging && (

            <Loader2
              className="
                h-4
                w-4
                animate-spin
                text-text-muted
              "
            />

          )}

        </div>

      </CardHeader>


      {/* ===================================================
          CONTENT
      =================================================== */}

      <CardContent
        className="
          min-h-0
          flex-1
          p-0
        "
      >

        {isEmpty ? (

          <EmptyState
            icon={Bell}
            title="No alerts"
            description="All clear — no active or recent alerts"
            className="py-10"
          />

        ) : (

          /*
           * IMPORTANT:
           * This is the ONLY vertical scrolling area
           * inside the alerts panel.
           */
          <div
            className="
              alerts-scroll
              h-[500px]
              max-h-[500px]
              overflow-x-hidden
              overflow-y-auto
              overscroll-contain
              px-3
              py-3
            "
          >

            {/* =================================================
                ACTIVE ALERTS
            ================================================= */}

            {activeAlerts.length > 0 && (

              <div className="space-y-3">

                {activeAlerts.map(
                  (alert) => (

                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={
                        onAcknowledge
                      }
                      isAcknowledging={
                        isAcknowledging
                      }
                    />

                  )
                )}

              </div>

            )}


            {/* =================================================
                ACKNOWLEDGED
            ================================================= */}

            {acknowledgedAlerts.length >
              0 && (

              <div className="mt-4">

                <Separator className="mb-3" />

                <p
                  className="
                    mb-2
                    px-1
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.08em]
                    text-text-muted
                  "
                >
                  Acknowledged (
                  {
                    acknowledgedAlerts.length
                  }
                  )
                </p>


                <div className="space-y-2">

                  {acknowledgedAlerts
                    .slice(0, 5)
                    .map((alert) => (

                      <AlertItem
                        key={alert.id}
                        alert={alert}
                        onAcknowledge={
                          onAcknowledge
                        }
                        isAcknowledging={
                          isAcknowledging
                        }
                        acknowledged
                      />

                    ))}

                </div>


                {acknowledgedAlerts.length >
                  5 && (

                  <p
                    className="
                      px-1
                      py-2
                      text-center
                      text-xs
                      text-text-muted
                    "
                  >
                    +
                    {
                      acknowledgedAlerts.length -
                      5
                    }{' '}
                    more acknowledged
                  </p>

                )}

              </div>

            )}

          </div>

        )}

      </CardContent>

    </Card>
  );
}


/* =========================================================
   ALERT ITEM
========================================================= */

function AlertItem({
  alert,
  onAcknowledge,
  isAcknowledging,
  acknowledged = false,
}) {

  const config =
    alertTypeConfig[
      alert.alert_type
    ] ||
    alertTypeConfig.critical_incident;


  const statusConfig =
    alertStatusConfig[
      alert.status
    ] ||
    alertStatusConfig.active;


  const Icon = config.icon;


  return (
    <div
      className={cn(
        `
          relative
          w-full
          min-w-0
          rounded-xl
          border
          p-3.5
          transition-colors
        `,

        acknowledged
          ? `
              bg-background-tertiary/50
              opacity-70
            `
          : `
              bg-background
              hover:bg-background-secondary
            `,

        config.border
      )}
    >

      {/* =================================================
          ALERT CONTENT
      ================================================= */}

      <div className="flex min-w-0 items-start gap-3">

        {/* ICON */}

        <div
          className={cn(
            `
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
            `,
            config.color
          )}
        >

          <Icon
            className="h-4 w-4"
            aria-hidden="true"
          />

        </div>


        {/* TEXT */}

        <div className="min-w-0 flex-1">

          {/* TITLE ROW */}

          <div
            className="
              flex
              min-w-0
              items-start
              justify-between
              gap-2
            "
          >

            <div
              className="
                flex
                min-w-0
                flex-1
                flex-wrap
                items-center
                gap-1.5
              "
            >

              <span
                className="
                  truncate
                  text-sm
                  font-semibold
                  text-text-primary
                "
              >
                {config.label}
              </span>


              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 text-xs',
                  statusConfig.color
                )}
              >
                {statusConfig.label}
              </Badge>

            </div>


            <span
              className="
                shrink-0
                whitespace-nowrap
                text-xs
                text-text-muted
              "
            >
              {formatRelativeTime(
                alert.created_at
              )}
            </span>

          </div>


          {/* MESSAGE */}

          <p
            className="
              mt-1.5
              line-clamp-3
              break-words
              text-sm
              leading-5
              text-text-secondary
            "
          >
            {alert.message}
          </p>


          {/* INCIDENT ID */}

          {alert.incident_id && (

            <p
              className="
                mt-1.5
                truncate
                font-mono
                text-xs
                text-text-muted
              "
            >
              Incident:{' '}
              {alert.incident_id.slice(
                0,
                12
              )}
              ...
            </p>

          )}

        </div>

      </div>


      {/* =================================================
          ACKNOWLEDGE BUTTON
      ================================================= */}

      {!acknowledged &&
        alert.status === 'active' && (

        <div
          className="
            mt-3
            border-t
            border-border
            pt-3
          "
        >

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onAcknowledge(
                alert.id
              )
            }
            disabled={
              isAcknowledging
            }
            className="
              h-9
              w-full
              justify-center
              gap-2
            "
          >

            {isAcknowledging ? (

              <Loader2
                className="
                  h-3.5
                  w-3.5
                  animate-spin
                "
              />

            ) : (

              <CheckCircle
                className="h-3.5 w-3.5"
              />

            )}

            {isAcknowledging
              ? 'Acknowledging...'
              : 'Acknowledge'}

          </Button>

        </div>

      )}

    </div>
  );
}
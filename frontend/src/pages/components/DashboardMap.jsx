import * as React from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import {
  MapPin,
  Plus,
  Minus,
  LocateFixed,
} from 'lucide-react';

import L from 'leaflet';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/Card';

import {
  Badge,
  SeverityBadge,
  StatusBadge,
} from '../../components/ui/Badge';


/* =========================================================
   SEVERITY COLORS
========================================================= */

const severityColors = {
  critical: '#b91c1c',
  high: '#c2410c',
  medium: '#b45309',
  low: '#166534',
};


/* =========================================================
   LEAFLET DEFAULT ICON
========================================================= */

const DefaultIcon = L.icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;


/* =========================================================
   SEVERITY MARKER
========================================================= */

function createSeverityIcon(severity, selected) {
  const color =
    severityColors[severity] ||
    severityColors.medium;

  const symbol =
    severity === 'critical'
      ? '!'
      : severity === 'high'
        ? '!'
        : severity === 'medium'
          ? '•'
          : '•';

  return L.divIcon({
    className: 'emergency-map-marker',

    html: `
      <div class="emergency-marker ${selected ? 'is-selected' : ''}"
           style="--marker-color:${color}">
        <span>${symbol}</span>
      </div>
    `,

    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -19],
  });
}


/* =========================================================
   MAP SIZE FIX
   THIS FIXES THE GRAY / UNRENDERED TILE AREA
========================================================= */

function MapResizeFix() {
  const map = useMap();

  React.useEffect(() => {
    let frame1;
    let frame2;

    const refreshMap = () => {
      frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => {
          map.invalidateSize({
            animate: false,
            pan: false,
          });
        });
      });
    };

    refreshMap();

    const container = map.getContainer();

    let observer;

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        refreshMap();
      });

      observer.observe(container);
    }

    window.addEventListener(
      'resize',
      refreshMap
    );

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);

      observer?.disconnect();

      window.removeEventListener(
        'resize',
        refreshMap
      );
    };
  }, [map]);

  return null;
}


/* =========================================================
   INCIDENT POPUP
========================================================= */

function IncidentPopup({
  incident,
  onSelect,
}) {
  const incidentType =
    incident.incident_type
      ?.replace(/_/g, ' ')
      .replace(
        /\b\w/g,
        (char) => char.toUpperCase()
      ) ||
    'Unknown';

  const latitude =
    Number(incident.location_lat);

  const longitude =
    Number(incident.location_lng);

  const coordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
      ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      : 'Location unavailable';

  return (
    <div className="map-popup-content">

      <div className="map-popup-header">

        <div className="min-w-0 flex-1">

          <div className="flex items-center gap-2">

            <span className="map-popup-severity-dot" />

            <p className="map-popup-id">
              {incident.id?.slice(0, 12)}
              ...
            </p>

          </div>

          <p className="map-popup-description">
            {incident.description}
          </p>

        </div>

        <SeverityBadge
          severity={incident.severity}
        />

      </div>


      <div className="map-popup-location">

        <MapPin className="h-3.5 w-3.5 shrink-0" />

        <span>
          {incident.address ||
            coordinates}
        </span>

      </div>


      <div className="map-popup-tags">

        <Badge
          variant="outline"
          className="max-w-[125px] truncate text-xs"
        >
          {incidentType}
        </Badge>

        <StatusBadge
          status={incident.status}
        />

      </div>


      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.(incident);
        }}
        className="map-popup-action"
      >
        View incident details
      </button>

    </div>
  );
}


/* =========================================================
   MAP CONTROLS
========================================================= */

function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
}) {
  return (
    <div className="map-controls">

      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
        className="map-control-button"
      >
        <Plus className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
        className="map-control-button"
      >
        <Minus className="h-4 w-4" />
      </button>

      <div className="map-control-divider" />

      <button
        type="button"
        onClick={onReset}
        aria-label="Reset map"
        title="Reset map"
        className="map-control-button"
      >
        <LocateFixed className="h-4 w-4" />
      </button>

    </div>
  );
}


/* =========================================================
   MAP CONTENT
========================================================= */

function MapContent({
  incidents,
  selectedIncidentId,
  onSelect,
  mapRef,
}) {
  const [viewport, setViewport] =
    React.useState({
      center: [
        20.5937,
        78.9629,
      ],
      zoom: 5,
    });


  /* -------------------------------------------------------
     Valid incidents
  ------------------------------------------------------- */

  const validIncidents =
    React.useMemo(
      () =>
        incidents.filter(
          (incident) =>
            Number.isFinite(
              Number(
                incident.location_lat
              )
            ) &&
            Number.isFinite(
              Number(
                incident.location_lng
              )
            )
        ),
      [incidents]
    );


  /* -------------------------------------------------------
     Fit incidents
  ------------------------------------------------------- */

  const fitIncidents =
    React.useCallback(
      (map) => {
        if (
          !map ||
          validIncidents.length === 0
        ) {
          return;
        }

        const bounds =
          L.latLngBounds(
            validIncidents.map(
              (incident) => [
                Number(
                  incident.location_lat
                ),
                Number(
                  incident.location_lng
                ),
              ]
            )
          );

        if (bounds.isValid()) {
          map.fitBounds(
            bounds,
            {
              padding: [
                35,
                35,
              ],
              maxZoom: 12,
              animate: false,
            }
          );
        }
      },
      [validIncidents]
    );


  /* -------------------------------------------------------
     Map ready
  ------------------------------------------------------- */

  const handleMapReady =
    React.useCallback(
      (map) => {
        mapRef.current = map;

        /*
         * Critical:
         * Leaflet needs to know the final dimensions
         * of the CardContent before rendering tiles.
         */
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            map.invalidateSize({
              animate: false,
              pan: false,
            });

            fitIncidents(map);
          });
        });
      },
      [fitIncidents, mapRef]
    );


  /* -------------------------------------------------------
     Re-fit when incidents change
  ------------------------------------------------------- */

  React.useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      mapRef.current.invalidateSize({
        animate: false,
        pan: false,
      });

      fitIncidents(
        mapRef.current
      );
    });
  }, [
    incidents,
    fitIncidents,
    mapRef,
  ]);


  /* -------------------------------------------------------
     Selected incident
  ------------------------------------------------------- */

  React.useEffect(() => {
    if (
      !mapRef.current ||
      !selectedIncidentId
    ) {
      return;
    }

    const incident =
      incidents.find(
        (item) =>
          item.id ===
          selectedIncidentId
      );

    if (!incident) {
      return;
    }

    const lat =
      Number(
        incident.location_lat
      );

    const lng =
      Number(
        incident.location_lng
      );

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return;
    }

    mapRef.current.flyTo(
      [lat, lng],
      14,
      {
        duration: 0.8,
      }
    );
  }, [
    selectedIncidentId,
    incidents,
    mapRef,
  ]);


  /* -------------------------------------------------------
     Controls
  ------------------------------------------------------- */

  const zoomIn =
    React.useCallback(() => {
      mapRef.current?.zoomIn();
    }, [mapRef]);


  const zoomOut =
    React.useCallback(() => {
      mapRef.current?.zoomOut();
    }, [mapRef]);


  const resetView =
    React.useCallback(() => {
      const map =
        mapRef.current;

      if (!map) {
        return;
      }

      if (
        validIncidents.length > 0
      ) {
        fitIncidents(map);
      } else {
        map.setView(
          [
            20.5937,
            78.9629,
          ],
          5
        );
      }
    }, [
      validIncidents,
      fitIncidents,
      mapRef,
    ]);


  return (
    <div className="dashboard-map-viewport">

      <MapContainer
        ref={handleMapReady}
        center={viewport.center}
        zoom={viewport.zoom}
        className="dashboard-leaflet-map"
        zoomControl={false}
        attributionControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
        keyboard={true}
      >

        <MapResizeFix />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        />


        {validIncidents.map(
          (incident) => (
            <Marker
              key={incident.id}
              position={[
                Number(
                  incident.location_lat
                ),
                Number(
                  incident.location_lng
                ),
              ]}
              icon={createSeverityIcon(
                incident.severity,
                incident.id ===
                  selectedIncidentId
              )}
            >

              <Popup
                closeButton
                autoPan
                keepInView
                autoPanPadding={[
                  20,
                  20,
                ]}
                maxWidth={280}
                minWidth={220}
                className="dashboard-map-popup"
              >

                <IncidentPopup
                  incident={incident}
                  onSelect={onSelect}
                />

              </Popup>

            </Marker>
          )
        )}

      </MapContainer>


      <MapControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
      />


      {validIncidents.length === 0 && (
        <div className="map-empty-state">

          <div className="map-empty-content">

            <MapPin className="h-8 w-8 text-text-muted mx-auto mb-2" />

            <p className="text-sm font-medium text-text-secondary">
              No incidents to display
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Incidents will appear here when reported
            </p>

          </div>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   MAIN DASHBOARD MAP
   HEIGHT REMAINS EXACTLY 380px
========================================================= */

export function DashboardMap({
  incidents = [],
  selectedIncidentId,
  onSelect,
}) {
  const mapRef =
    React.useRef(null);


  return (
    <Card
      className="
        dashboard-map-card
        flex
        h-[380px]
        min-h-[380px]
        w-full
        min-w-0
        flex-col
        overflow-hidden
        rounded-xl
      "
    >

      {/* HEADER */}

      <CardHeader
        className="
          shrink-0
          px-4
          py-3
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >

          <CardTitle
            className="
              flex
              items-center
              gap-2
              text-sm
              font-semibold
            "
          >

            <MapPin className="h-4 w-4 text-text-secondary" />

            Incident Map

          </CardTitle>


          <Badge
            variant="outline"
            className="
              shrink-0
              gap-1.5
              rounded-full
              px-3
              py-1
              text-xs
            "
          >

            <MapPin className="h-3.5 w-3.5" />

            {incidents.length} incidents

          </Badge>

        </div>

      </CardHeader>


      {/* MAP */}

      <CardContent
        className="
          relative
          min-h-0
          flex-1
          overflow-hidden
          p-0
        "
      >

        <MapContent
          incidents={incidents}
          selectedIncidentId={
            selectedIncidentId
          }
          onSelect={onSelect}
          mapRef={mapRef}
        />

      </CardContent>

    </Card>
  );
}
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import {
  ShieldAlert,
  Truck,
  Layers,
  Search,
  AlertTriangle,
  MapPin,
  Radio,
  X,
  Navigation,
  Crosshair,
} from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import { Badge, SeverityBadge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  useDashboardOverview,
  useResources,
} from '../hooks/useApi';


/* -------------------------------------------------------------------------- */
/* LEAFLET ICONS                                                              */
/* -------------------------------------------------------------------------- */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const AHMEDABAD_CENTER = [23.0225, 72.5714];

const severityColors = {
  critical: '#b91c1c',
  high: '#c2410c',
  medium: '#b45309',
  low: '#166534',
};

const resourceStatusColors = {
  available: '#16803c',
  dispatched: '#2563a8',
  maintenance: '#b7791f',
  unavailable: '#6b7280',
};


/* -------------------------------------------------------------------------- */
/* MARKER ICONS                                                               */
/* -------------------------------------------------------------------------- */

const createSeverityIcon = (severity, selected = false) => {
  const color =
    severityColors[severity] ||
    severityColors.medium;

  return L.divIcon({
    className: 'custom-severity-marker',
    html: `
      <div
        style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: ${color};
          border: ${selected ? '3px solid #ffffff' : '2px solid #ffffff'};
          box-shadow:
            0 3px 10px rgba(0,0,0,0.22),
            0 0 0 1px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
        "
      >
        ${
          severity === 'critical'
            ? '!'
            : severity === 'high'
              ? '!'
              : '•'
        }
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -17],
  });
};


const createResourceIcon = (
  status,
  selected = false
) => {
  const color =
    resourceStatusColors[status] ||
    resourceStatusColors.unavailable;

  return L.divIcon({
    className: 'custom-resource-marker',
    html: `
      <div
        style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: ${color};
          border: ${selected ? '3px solid #ffffff' : '2px solid #ffffff'};
          box-shadow:
            0 3px 10px rgba(0,0,0,0.22),
            0 0 0 1px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
        "
      >
        •
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -17],
  });
};


/* -------------------------------------------------------------------------- */
/* REAL COORDINATES ONLY                                                      */
/* -------------------------------------------------------------------------- */

const getCoordinates = (entity) => {
  const lat =
    entity?.location_lat ??
    entity?.latitude;

  const lng =
    entity?.location_lng ??
    entity?.longitude;

  if (
    lat === undefined ||
    lng === undefined ||
    lat === null ||
    lng === null
  ) {
    return null;
  }

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (
    !Number.isFinite(parsedLat) ||
    !Number.isFinite(parsedLng)
  ) {
    return null;
  }

  if (
    parsedLat < -90 ||
    parsedLat > 90 ||
    parsedLng < -180 ||
    parsedLng > 180
  ) {
    return null;
  }

  return [parsedLat, parsedLng];
};


/* -------------------------------------------------------------------------- */
/* MAP FITTER                                                                 */
/* -------------------------------------------------------------------------- */

function FitMapToEntities({
  incidents,
  resources,
}) {
  const map = useMap();

  React.useEffect(() => {
    const coordinates = [
      ...incidents,
      ...resources,
    ]
      .map(getCoordinates)
      .filter(Boolean);

    if (coordinates.length === 0) {
      map.setView(
        AHMEDABAD_CENTER,
        12
      );
      return;
    }

    if (coordinates.length === 1) {
      map.setView(
        coordinates[0],
        13
      );
      return;
    }

    const bounds =
      L.latLngBounds(coordinates);

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 13,
      });
    }
  }, [map, incidents, resources]);

  return null;
}


/* -------------------------------------------------------------------------- */
/* MAP CONTROLS                                                               */
/* -------------------------------------------------------------------------- */

function MapControls() {
  const map = useMap();

  const zoomIn = () => {
    map.zoomIn();
  };

  const zoomOut = () => {
    map.zoomOut();
  };

  const reset = () => {
    map.setView(
      AHMEDABAD_CENTER,
      12,
      { animate: true }
    );
  };

  return (
    <div className="absolute right-4 bottom-4 z-[900] flex flex-col gap-1.5">

      <button
        type="button"
        onClick={zoomIn}
        aria-label="Zoom in"
        className="
          flex h-9 w-9 items-center justify-center
          rounded-lg
          border border-[#d7dcd9]
          bg-[#fffefa]
          text-[#33404a]
          shadow-[0_2px_8px_rgba(0,0,0,0.10)]
          transition-colors
          hover:bg-[#f3f6f4]
        "
      >
        +
      </button>

      <button
        type="button"
        onClick={zoomOut}
        aria-label="Zoom out"
        className="
          flex h-9 w-9 items-center justify-center
          rounded-lg
          border border-[#d7dcd9]
          bg-[#fffefa]
          text-[#33404a]
          shadow-[0_2px_8px_rgba(0,0,0,0.10)]
          transition-colors
          hover:bg-[#f3f6f4]
        "
      >
        −
      </button>

      <button
        type="button"
        onClick={reset}
        aria-label="Reset map"
        title="Reset map"
        className="
          mt-1
          flex h-9 w-9 items-center justify-center
          rounded-lg
          border border-[#d7dcd9]
          bg-[#fffefa]
          text-[#33404a]
          shadow-[0_2px_8px_rgba(0,0,0,0.10)]
          transition-colors
          hover:bg-[#f3f6f4]
        "
      >
        <Crosshair className="h-4 w-4" />
      </button>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function MapPage() {
  const navigate = useNavigate();

  const [filterType, setFilterType] =
    useState('all');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [showLegend, setShowLegend] =
    useState(true);

  const {
    data: overview,
    isError: errIncidents,
  } = useDashboardOverview();

  const {
    data: resources = [],
    isError: errResources,
  } = useResources();


  /* ------------------------------------------------------------------------ */
  /* ERROR                                                                    */
  /* ------------------------------------------------------------------------ */

  if (errIncidents || errResources) {
    return (
      <PageContainer>
        <div
          className="
            flex min-h-[420px]
            flex-col items-center justify-center
            rounded-2xl
            border border-[#e6caca]
            bg-[#fff7f6]
            p-12
            text-center
          "
        >
          <div
            className="
              mb-4 flex h-14 w-14
              items-center justify-center
              rounded-2xl
              bg-[#fde9e7]
            "
          >
            <AlertTriangle className="h-7 w-7 text-[#b91c1c]" />
          </div>

          <h3 className="text-lg font-semibold text-[#8f2424]">
            Backend Disconnected
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-[#7e5555]">
            Unable to connect to the backend server.
            Please make sure FastAPI is running.
          </p>
        </div>
      </PageContainer>
    );
  }


  /* ------------------------------------------------------------------------ */
  /* DATA                                                                     */
  /* ------------------------------------------------------------------------ */

  const activeIncidents =
    overview?.incidents || [];

  const activeResources =
    Array.isArray(resources)
      ? resources
      : [];

  const query =
    searchQuery.trim().toLowerCase();


  /* ------------------------------------------------------------------------ */
  /* FILTERS                                                                  */
  /* ------------------------------------------------------------------------ */

  const filteredIncidents =
    activeIncidents.filter((incident) => {

      const searchableText = [
        incident.title,
        incident.incident_type,
        incident.description,
        incident.address,
        incident.location_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      const matchesType =
        filterType === 'all' ||
        filterType === 'incidents';

      return (
        matchesSearch &&
        matchesType
      );
    });


  const filteredResources =
    activeResources.filter((resource) => {

      const searchableText = [
        resource.name,
        resource.type,
        resource.category,
        resource.current_location,
        resource.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      const matchesType =
        filterType === 'all' ||
        filterType === 'resources';

      return (
        matchesSearch &&
        matchesType
      );
    });


  const incidentsWithCoordinates =
    filteredIncidents.filter(
      (incident) =>
        getCoordinates(incident)
    );

  const resourcesWithCoordinates =
    filteredResources.filter(
      (resource) =>
        getCoordinates(resource)
    );


  /* ------------------------------------------------------------------------ */
  /* SELECTION                                                                */
  /* ------------------------------------------------------------------------ */

  const handleSelectIncident = (
    incident
  ) => {
    setSelectedItem({
      type: 'incident',
      data: incident,
    });
  };


  const handleSelectResource = (
    resource
  ) => {
    setSelectedItem({
      type: 'resource',
      data: resource,
    });
  };


  const handleViewProfile = () => {
    if (!selectedItem) return;

    if (
      selectedItem.type ===
      'incident'
    ) {
      navigate(
        `/incidents/${selectedItem.data.id}`
      );
    } else {
      navigate('/resources');
    }
  };


  const visibleEntityCount =
    filteredIncidents.length +
    filteredResources.length;


  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <PageContainer>

      <div className="flex h-[calc(100vh-140px)] min-h-[600px] flex-col gap-4">

        {/* ---------------------------------------------------------------- */}
        {/* HEADER                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex shrink-0 items-end justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-page-title text-text-primary">
                  Geospatial Operations
                </h1>

                <p className="mt-0.5 text-secondary text-text-muted">
                  Monitor incidents and response resources in real time
                </p>
              </div>

            </div>
          </div>


          <div
            className="
              hidden items-center gap-2
              rounded-full
              border border-[#d7e4da]
              bg-[#f3faf5]
              px-3 py-1.5
              text-xs
              font-medium
              text-[#24703b]
              sm:flex
            "
          >
            <span className="h-2 w-2 rounded-full bg-[#2f9b50]" />
            LIVE MAP
          </div>

        </div>


        {/* ---------------------------------------------------------------- */}
        {/* MAP WORKSPACE                                                    */}
        {/* ---------------------------------------------------------------- */}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[310px_minmax(0,1fr)]">

          {/* ============================================================ */}
          {/* LEFT PANEL                                                   */}
          {/* ============================================================ */}

          <aside
            className="
              flex
              min-h-0
              flex-col
              overflow-hidden
              rounded-2xl
              border border-[#dfe2de]
              bg-[#fffefa]
              shadow-[0_2px_10px_rgba(30,40,50,0.05)]
            "
          >

            {/* Panel header */}
            <div
              className="
                shrink-0
                border-b border-[#e5e6e1]
                bg-[#fafaf7]
                px-4 py-4
              "
            >

              <div className="mb-3 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <div
                    className="
                      flex h-8 w-8
                      items-center justify-center
                      rounded-lg
                      bg-[#edf2f5]
                    "
                  >
                    <Layers className="h-4 w-4 text-[#315b78]" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#26343e]">
                      Map Layers
                    </p>

                    <p className="text-[11px] text-[#8a9297]">
                      Operational entities
                    </p>
                  </div>

                </div>

                <span className="font-mono text-xs text-[#8b9298]">
                  {visibleEntityCount}
                </span>

              </div>


              {/* Filter tabs */}
              <div
                className="
                  grid grid-cols-3
                  rounded-lg
                  border border-[#dfe2df]
                  bg-[#f0f1ee]
                  p-1
                "
              >

                {[
                  ['all', 'All'],
                  ['incidents', 'Incidents'],
                  ['resources', 'Resources'],
                ].map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setFilterType(value)
                      }
                      className={`
                        rounded-md
                        px-2 py-1.5
                        text-[11px]
                        font-medium
                        transition-all
                        ${
                          filterType === value
                            ? 'bg-[#fffefa] text-[#234f72] shadow-sm'
                            : 'text-[#707980] hover:text-[#39454e]'
                        }
                      `}
                    >
                      {label}
                    </button>
                  )
                )}

              </div>


              {/* Search */}
              <div className="relative mt-3">

                <Search
                  className="
                    pointer-events-none
                    absolute left-3 top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-[#899197]
                  "
                />

                <Input
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  className="
                    h-9
                    border-[#d9ddda]
                    bg-white
                    pl-9
                    text-xs
                    shadow-none
                  "
                />

              </div>

            </div>


            {/* Entity list */}
            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                p-3
                scrollbar-thin
              "
            >

              <div className="mb-2 flex items-center justify-between px-1">

                <span
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    text-[#858d92]
                  "
                >
                  Active entities
                </span>

                <span className="font-mono text-[10px] text-[#9aa0a4]">
                  {visibleEntityCount}
                </span>

              </div>


              <div className="space-y-2">

                {/* ------------------------------------------------------ */}
                {/* INCIDENTS                                               */}
                {/* ------------------------------------------------------ */}

                {(
                  filterType === 'all' ||
                  filterType === 'incidents'
                ) &&
                  filteredIncidents.map(
                    (incident) => {

                      const selected =
                        selectedItem?.type ===
                          'incident' &&
                        selectedItem.data.id ===
                          incident.id;

                      return (
                        <button
                          type="button"
                          key={`incident-${incident.id}`}
                          onClick={() =>
                            handleSelectIncident(
                              incident
                            )
                          }
                          className={`
                            group
                            w-full
                            rounded-xl
                            border
                            p-3
                            text-left
                            transition-all
                            ${
                              selected
                                ? 'border-[#9fb6c7] bg-[#eef4f7] shadow-sm'
                                : 'border-[#e2e4df] bg-[#fffefa] hover:border-[#c8d2d8] hover:bg-[#f8faf9]'
                            }
                          `}
                        >

                          <div className="flex items-start justify-between gap-2">

                            <div className="flex min-w-0 items-start gap-2.5">

                              <div
                                className={`
                                  mt-0.5
                                  flex h-7 w-7
                                  shrink-0
                                  items-center justify-center
                                  rounded-lg
                                  ${
                                    incident.severity ===
                                    'critical'
                                      ? 'bg-[#fde8e6]'
                                      : incident.severity ===
                                          'high'
                                        ? 'bg-[#fff0e8]'
                                        : 'bg-[#f2f3f1]'
                                  }
                                `}
                              >
                                <ShieldAlert
                                  className={`
                                    h-3.5 w-3.5
                                    ${
                                      incident.severity ===
                                      'critical'
                                        ? 'text-[#b91c1c]'
                                        : incident.severity ===
                                            'high'
                                          ? 'text-[#c2410c]'
                                          : 'text-[#68727a]'
                                    }
                                  `}
                                />
                              </div>

                              <div className="min-w-0">

                                <p className="truncate text-xs font-semibold capitalize text-[#27343d]">
                                  {incident.incident_type
                                    ?.replace(
                                      '_',
                                      ' '
                                    ) ||
                                    incident.title ||
                                    'Emergency'}
                                </p>

                                <p className="mt-1 truncate text-[11px] text-[#81898f]">
                                  {incident.address ||
                                    incident.location_name ||
                                    'Location unavailable'}
                                </p>

                              </div>

                            </div>

                            <SeverityBadge
                              severity={
                                incident.severity
                              }
                            />

                          </div>

                        </button>
                      );
                    }
                  )}


                {/* ------------------------------------------------------ */}
                {/* RESOURCES                                               */}
                {/* ------------------------------------------------------ */}

                {(
                  filterType === 'all' ||
                  filterType === 'resources'
                ) &&
                  filteredResources.map(
                    (resource) => {

                      const selected =
                        selectedItem?.type ===
                          'resource' &&
                        selectedItem.data.id ===
                          resource.id;

                      return (
                        <button
                          type="button"
                          key={`resource-${resource.id}`}
                          onClick={() =>
                            handleSelectResource(
                              resource
                            )
                          }
                          className={`
                            group
                            w-full
                            rounded-xl
                            border
                            p-3
                            text-left
                            transition-all
                            ${
                              selected
                                ? 'border-[#9fb6c7] bg-[#eef4f7] shadow-sm'
                                : 'border-[#e2e4df] bg-[#fffefa] hover:border-[#c8d2d8] hover:bg-[#f8faf9]'
                            }
                          `}
                        >

                          <div className="flex items-start justify-between gap-2">

                            <div className="flex min-w-0 items-start gap-2.5">

                              <div
                                className="
                                  mt-0.5
                                  flex h-7 w-7
                                  shrink-0
                                  items-center justify-center
                                  rounded-lg
                                  bg-[#edf4f8]
                                "
                              >
                                <Truck className="h-3.5 w-3.5 text-[#315f89]" />
                              </div>

                              <div className="min-w-0">

                                <p className="truncate text-xs font-semibold text-[#27343d]">
                                  {resource.name ||
                                    resource.type ||
                                    resource.category ||
                                    'Resource'}
                                </p>

                                <p className="mt-1 truncate text-[11px] text-[#81898f]">
                                  {resource.current_location ||
                                    'Location unavailable'}
                                </p>

                              </div>

                            </div>

                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px]"
                            >
                              {resource.status ||
                                'Available'}
                            </Badge>

                          </div>

                        </button>
                      );
                    }
                  )}


                {/* ------------------------------------------------------ */}
                {/* EMPTY                                                   */}
                {/* ------------------------------------------------------ */}

                {visibleEntityCount === 0 && (
                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      justify-center
                      rounded-xl
                      border border-dashed
                      border-[#d9ddda]
                      bg-[#fafaf7]
                      px-5 py-12
                      text-center
                    "
                  >
                    <div
                      className="
                        mb-3
                        flex h-10 w-10
                        items-center justify-center
                        rounded-full
                        bg-[#edf0ed]
                      "
                    >
                      <Search className="h-4 w-4 text-[#8a9297]" />
                    </div>

                    <p className="text-sm font-medium text-[#4b565e]">
                      No entities found
                    </p>

                    <p className="mt-1 text-xs text-[#8b9291]">
                      Try changing the filter or search term.
                    </p>
                  </div>
                )}

              </div>

            </div>


            {/* Legend toggle */}
            <div className="shrink-0 border-t border-[#e5e6e1] bg-[#fafaf7] p-3">

              <button
                type="button"
                onClick={() =>
                  setShowLegend(
                    (current) => !current
                  )
                }
                className="
                  flex w-full
                  items-center justify-between
                  rounded-lg
                  px-2 py-2
                  text-xs
                  text-[#667078]
                  hover:bg-[#f0f2ef]
                "
              >

                <span className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5" />
                  Map legend
                </span>

                <span className="text-[11px]">
                  {showLegend
                    ? 'Hide'
                    : 'Show'}
                </span>

              </button>

            </div>

          </aside>


          {/* ============================================================ */}
          {/* MAP                                                          */}
          {/* ============================================================ */}

          <section
            className="
              relative
              min-h-0
              overflow-hidden
              rounded-2xl
              border border-[#dfe2de]
              bg-[#e7e9e6]
              shadow-[0_2px_12px_rgba(30,40,50,0.06)]
            "
          >

            {/* Map header overlay */}
            <div
              className="
                absolute
                left-4 right-4 top-4
                z-[900]
                flex
                items-center
                justify-between
                pointer-events-none
              "
            >

              <div
                className="
                  pointer-events-auto
                  flex items-center gap-3
                  rounded-xl
                  border border-[#dce0dd]
                  bg-[#fffefa]/95
                  px-3.5 py-2.5
                  shadow-[0_3px_12px_rgba(0,0,0,0.10)]
                  backdrop-blur-sm
                "
              >

                <div
                  className="
                    flex h-8 w-8
                    items-center justify-center
                    rounded-lg
                    bg-[#edf4f7]
                  "
                >
                  <MapPin className="h-4 w-4 text-[#315f89]" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#29363f]">
                    Operations Map
                  </p>

                  <p className="text-[10px] text-[#81898e]">
                    Live incident & resource positions
                  </p>
                </div>

              </div>


              <div
                className="
                  pointer-events-auto
                  hidden items-center gap-2
                  rounded-xl
                  border border-[#dce0dd]
                  bg-[#fffefa]/95
                  px-3 py-2
                  text-xs
                  shadow-[0_3px_12px_rgba(0,0,0,0.10)]
                  backdrop-blur-sm
                  sm:flex
                "
              >
                <span className="h-2 w-2 rounded-full bg-[#3b9b55]" />
                {incidentsWithCoordinates.length +
                  resourcesWithCoordinates.length}{' '}
                mapped
              </div>

            </div>


            <MapContainer
              center={AHMEDABAD_CENTER}
              zoom={12}
              style={{
                width: '100%',
                height: '100%',
              }}
              zoomControl={false}
              attributionControl={true}
            >

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />


              <FitMapToEntities
                incidents={
                  incidentsWithCoordinates
                }
                resources={
                  resourcesWithCoordinates
                }
              />

              <MapControls />


              {/* ------------------------------------------------------ */}
              {/* INCIDENT MARKERS                                       */}
              {/* ------------------------------------------------------ */}

              {(
                filterType === 'all' ||
                filterType === 'incidents'
              ) &&
                incidentsWithCoordinates.map(
                  (incident) => {

                    const coordinates =
                      getCoordinates(
                        incident
                      );

                    const selected =
                      selectedItem?.type ===
                        'incident' &&
                      selectedItem.data.id ===
                        incident.id;

                    return (
                      <Marker
                        key={`incident-marker-${incident.id}`}
                        position={coordinates}
                        icon={createSeverityIcon(
                          incident.severity,
                          selected
                        )}
                        eventHandlers={{
                          click: () =>
                            handleSelectIncident(
                              incident
                            ),
                        }}
                      >

                        <Popup
                          autoClose={false}
                          closeOnClick={false}
                          className="custom-popup"
                        >

                          <div className="w-[250px] p-1">

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <p className="text-sm font-semibold capitalize text-[#27343d]">
                                  {incident.incident_type
                                    ?.replace(
                                      '_',
                                      ' '
                                    ) ||
                                    incident.title ||
                                    'Incident'}
                                </p>

                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#737c82]">
                                  {incident.description ||
                                    'No description available'}
                                </p>

                              </div>

                              <SeverityBadge
                                severity={
                                  incident.severity
                                }
                              />

                            </div>


                            <div className="mt-3 flex items-center gap-2 border-t border-[#e6e6e2] pt-3">

                              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#7c858b]" />

                              <span className="truncate text-xs text-[#667078]">
                                {incident.address ||
                                  incident.location_name ||
                                  'Location unavailable'}
                              </span>

                            </div>


                            <div className="mt-3 flex items-center gap-2">

                              <Badge
                                variant="outline"
                                className="text-[10px] capitalize"
                              >
                                {incident.incident_type
                                  ?.replace(
                                    '_',
                                    ' '
                                  ) ||
                                  'Unknown'}
                              </Badge>

                              <Badge
                                variant="outline"
                                className="text-[10px] capitalize"
                              >
                                {incident.status
                                  ?.replace(
                                    '_',
                                    ' '
                                  ) ||
                                  'Unknown'}
                              </Badge>

                            </div>


                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(
                                  `/incidents/${incident.id}`
                                );
                              }}
                              className="
                                mt-3
                                flex w-full
                                items-center justify-center gap-1.5
                                rounded-lg
                                bg-[#244f73]
                                py-2
                                text-xs
                                font-medium
                                text-white
                                transition-colors
                                hover:bg-[#1d425f]
                              "
                            >
                              View Incident
                            </button>

                          </div>

                        </Popup>

                      </Marker>
                    );
                  }
                )}


              {/* ------------------------------------------------------ */}
              {/* RESOURCE MARKERS                                       */}
              {/* ------------------------------------------------------ */}

              {(
                filterType === 'all' ||
                filterType === 'resources'
              ) &&
                resourcesWithCoordinates.map(
                  (resource) => {

                    const coordinates =
                      getCoordinates(
                        resource
                      );

                    const selected =
                      selectedItem?.type ===
                        'resource' &&
                      selectedItem.data.id ===
                        resource.id;

                    return (
                      <Marker
                        key={`resource-marker-${resource.id}`}
                        position={coordinates}
                        icon={createResourceIcon(
                          resource.status,
                          selected
                        )}
                        eventHandlers={{
                          click: () =>
                            handleSelectResource(
                              resource
                            ),
                        }}
                      >

                        <Popup
                          autoClose={false}
                          closeOnClick={false}
                          className="custom-popup"
                        >

                          <div className="w-[220px] p-1">

                            <div className="flex items-start gap-3">

                              <div
                                className="
                                  flex h-9 w-9
                                  shrink-0
                                  items-center justify-center
                                  rounded-lg
                                  bg-[#edf4f8]
                                "
                              >
                                <Truck className="h-4 w-4 text-[#315f89]" />
                              </div>

                              <div className="min-w-0">

                                <p className="truncate text-sm font-semibold text-[#27343d]">
                                  {resource.name ||
                                    resource.type ||
                                    resource.category ||
                                    'Resource'}
                                </p>

                                <p className="mt-1 text-xs capitalize text-[#737c82]">
                                  {resource.status ||
                                    'Available'}
                                </p>

                              </div>

                            </div>


                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(
                                  '/resources'
                                );
                              }}
                              className="
                                mt-3
                                flex w-full
                                items-center justify-center gap-1.5
                                rounded-lg
                                border border-[#d6dcd9]
                                bg-[#fafbf9]
                                py-2
                                text-xs
                                font-medium
                                text-[#315f89]
                                hover:bg-[#f0f4f2]
                              "
                            >
                              View Resource
                            </button>

                          </div>

                        </Popup>

                      </Marker>
                    );
                  }
                )}

            </MapContainer>


            {/* ---------------------------------------------------------- */}
            {/* LEGEND                                                     */}
            {/* ---------------------------------------------------------- */}

            {showLegend && (
              <div
                className="
                  absolute
                  bottom-4 left-4
                  z-[900]
                  hidden
                  w-[210px]
                  rounded-xl
                  border border-[#dce0dd]
                  bg-[#fffefa]/95
                  p-3
                  shadow-[0_3px_12px_rgba(0,0,0,0.10)]
                  backdrop-blur-sm
                  sm:block
                "
              >

                <div className="mb-3 flex items-center justify-between">

                  <span
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.12em]
                      text-[#747d83]
                    "
                  >
                    Map Legend
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setShowLegend(false)
                    }
                    className="
                      rounded-md
                      p-1
                      text-[#8a9297]
                      hover:bg-[#f0f2ef]
                      hover:text-[#35414a]
                    "
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                </div>


                <div className="space-y-2">

                  {[
                    [
                      '#b91c1c',
                      'Critical',
                    ],
                    [
                      '#c2410c',
                      'High',
                    ],
                    [
                      '#b45309',
                      'Medium',
                    ],
                    [
                      '#166534',
                      'Low',
                    ],
                  ].map(
                    ([color, label]) => (
                      <div
                        key={label}
                        className="flex items-center gap-2"
                      >

                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              color,
                          }}
                        />

                        <span className="text-[11px] text-[#687178]">
                          {label} severity
                        </span>

                      </div>
                    )
                  )}


                  <div className="my-2 border-t border-[#e6e7e3]" />


                  {[
                    [
                      '#16803c',
                      'Available resource',
                    ],
                    [
                      '#2563a8',
                      'Dispatched resource',
                    ],
                    [
                      '#b7791f',
                      'Maintenance',
                    ],
                  ].map(
                    ([color, label]) => (
                      <div
                        key={label}
                        className="flex items-center gap-2"
                      >

                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              color,
                          }}
                        />

                        <span className="text-[11px] text-[#687178]">
                          {label}
                        </span>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}


            {/* ---------------------------------------------------------- */}
            {/* SELECTED ENTITY                                            */}
            {/* ---------------------------------------------------------- */}

            {selectedItem && (
              <div
                className="
                  absolute
                  bottom-4 right-4
                  z-[900]
                  w-[300px]
                  max-w-[calc(100%-32px)]
                  rounded-xl
                  border border-[#dce0dd]
                  bg-[#fffefa]/96
                  p-4
                  shadow-[0_5px_20px_rgba(0,0,0,0.13)]
                  backdrop-blur-sm
                "
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex items-center gap-2">

                    <div
                      className="
                        flex h-8 w-8
                        items-center justify-center
                        rounded-lg
                        bg-[#edf4f7]
                      "
                    >
                      {selectedItem.type ===
                      'incident' ? (
                        <ShieldAlert className="h-4 w-4 text-[#b04a35]" />
                      ) : (
                        <Truck className="h-4 w-4 text-[#315f89]" />
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#899095]">
                        {selectedItem.type ===
                        'incident'
                          ? 'Incident'
                          : 'Resource'}
                      </p>

                      <p className="text-sm font-semibold text-[#27343d]">
                        {selectedItem.data.incident_type ||
                          selectedItem.data.title ||
                          selectedItem.data.name ||
                          'Entity'}
                      </p>
                    </div>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setSelectedItem(null)
                    }
                    className="
                      rounded-lg
                      p-1.5
                      text-[#899095]
                      hover:bg-[#f0f2ef]
                      hover:text-[#35414a]
                    "
                  >
                    <X className="h-4 w-4" />
                  </button>

                </div>


                <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#737c82]">
                  {selectedItem.type ===
                  'incident'
                    ? (
                      selectedItem.data.description ||
                      selectedItem.data.address ||
                      'Active emergency'
                    )
                    : `Type: ${
                        selectedItem.data.type ||
                        selectedItem.data.category ||
                        'General'
                      } · Status: ${
                        selectedItem.data.status ||
                        'Unknown'
                      }`}
                </p>


                <Button
                  size="sm"
                  onClick={
                    handleViewProfile
                  }
                  className="
                    mt-3
                    h-9
                    w-full
                    bg-[#244f73]
                    text-xs
                    hover:bg-[#1d425f]
                  "
                >
                  View Full Profile
                </Button>

              </div>
            )}

          </section>

        </div>

      </div>

    </PageContainer>
  );
}
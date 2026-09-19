import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getSeverityColor } from '../../lib/design-tokens';
import L from 'leaflet';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, SeverityBadge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/States';

const severityColors = {
  critical: '#b91c1c',
  high: '#c2410c',
  medium: '#b45309',
  low: '#166534',
};

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SeverityIcon = ({ severity, selected }) => {
  const color = severityColors[severity] || severityColors.medium;
  return L.divIcon({
    className: 'custom-severity-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${color};
        border: ${selected ? '3px solid #fff' : '2px solid #fff'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
      ">
        ${severity === 'critical' ? '!' : severity === 'high' ? '⚠' : '●'}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

function MapComponent({ incidents, selectedIncidentId, onSelect, center, zoom }) {
  const mapRef = React.useRef(null);
  
  React.useEffect(() => {
    if (mapRef.current && selectedIncidentId) {
      const incident = incidents.find(i => i.id === selectedIncidentId);
      if (incident) {
        mapRef.current.flyTo([incident.location_lat, incident.location_lng], 14, { duration: 1 });
      }
    }
  }, [selectedIncidentId, incidents]);

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.location_lat, incident.location_lng]}
          icon={SeverityIcon({ severity: incident.severity, selected: incident.id === selectedIncidentId })}
        >
          <Popup
            autoClose={false}
            closeOnClick={false}
            className="custom-popup"
          >
            <div className="p-2 min-w-[200px]">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="font-semibold text-text-primary text-sm">
                    {incident.id.slice(0, 12)}...
                  </p>
                  <p className="text-xs text-text-muted truncate max-w-[180px]">
                    {incident.description}
                  </p>
                </div>
                <SeverityBadge severity={incident.severity} />
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {incident.address || `${incident.location_lat.toFixed(4)}, ${incident.location_lng.toFixed(4)}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {incident.incident_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'}
                </Badge>
                <StatusBadge status={incident.status} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(incident);
                }}
                className="mt-2 w-full text-xs text-primary hover:text-primary-hover font-medium flex items-center justify-center gap-1"
              >
                <MapPin className="h-3 w-3" />
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function MapControls({ zoom, center, onZoomIn, onZoomOut, onReset }) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
      <button onClick={onZoomIn} className="btn-map-control" aria-label="Zoom in" title="Zoom in">+</button>
      <button onClick={onZoomOut} className="btn-map-control" aria-label="Zoom out" title="Zoom out">−</button>
      <button onClick={onReset} className="btn-map-control" aria-label="Reset view" title="Reset view">⌂</button>
    </div>
  );
}

function MapView({ incidents, selectedIncidentId, onSelect }) {
  const [mapInstance, setMapInstance] = React.useState(null);
  const [viewport, setViewport] = React.useState({ center: [20.5937, 78.9629], zoom: 5 });

  const handleMapReady = (map) => {
    if (!map) return;
    setMapInstance(map);
    if (incidents.length > 0) {
      const bounds = L.latLngBounds(incidents.map(i => [i.location_lat, i.location_lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  };

  const handleMoveEnd = () => {
    if (mapInstance) {
      setViewport({
        center: [mapInstance.getCenter().lat, mapInstance.getCenter().lng],
        zoom: mapInstance.getZoom(),
      });
    }
  };

  const zoomIn = () => mapInstance?.zoomIn();
  const zoomOut = () => mapInstance?.zoomOut();
  const resetView = () => {
    if (incidents.length > 0) {
      const bounds = L.latLngBounds(incidents.map(i => [i.location_lat, i.location_lng]));
      if (bounds.isValid()) {
        mapInstance?.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      } else {
        mapInstance?.setView([20.5937, 78.9629], 5);
      }
    } else {
      mapInstance?.setView([20.5937, 78.9629], 5);
    }
  };

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden border border-border bg-background">
      <MapContainer
        ref={handleMapReady}
        center={viewport.center}
        zoom={viewport.zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={true}
        onMoveend={handleMoveEnd}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.location_lat, incident.location_lng]}
            icon={SeverityIcon({ severity: incident.severity, selected: incident.id === selectedIncidentId })}
          >
            <Popup
              autoClose={false}
              closeOnClick={false}
              className="custom-popup"
            >
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">
                      {incident.id.slice(0, 12)}...
                    </p>
                    <p className="text-xs text-text-muted truncate max-w-[180px]">
                      {incident.description}
                    </p>
                  </div>
                  <SeverityBadge severity={incident.severity} />
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {incident.address || `${incident.location_lat.toFixed(4)}, ${incident.location_lng.toFixed(4)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {incident.incident_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'}
                  </Badge>
                  <StatusBadge status={incident.status} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(incident);
                  }}
                  className="mt-2 w-full text-xs text-primary hover:text-primary-hover font-medium flex items-center justify-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <MapControls zoom={viewport.zoom} center={viewport.center} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
      {incidents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center p-4">
            <MapPin className="h-12 w-12 mx-auto text-text-muted mb-3" />
            <p className="text-text-secondary">No incidents to display</p>
            <p className="text-sm text-text-muted mt-1">Incidents will appear on the map when reported</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    reported: 'bg-blue-100 text-blue-800',
    verified: 'bg-sky-100 text-sky-800',
    dispatched: 'bg-violet-100 text-violet-800',
    in_progress: 'bg-amber-100 text-amber-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    duplicate: 'bg-red-100 text-red-800',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[status] || colors.reported)}>
      {status?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'}
    </span>
  );
}

export function DashboardMap({ incidents, selectedIncidentId, onSelect }) {
  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Incident Map</CardTitle>
          <Badge variant="outline" className="gap-1">
            <MapPin className="h-3 w-3" />
            {incidents.length} incidents
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <MapView incidents={incidents} selectedIncidentId={selectedIncidentId} onSelect={onSelect} />
      </CardContent>
    </Card>
  );
}
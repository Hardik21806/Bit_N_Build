import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  ShieldAlert, 
  Truck, 
  Layers, 
  Search,
  AlertTriangle 
} from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { useDashboardOverview, useResources } from '../hooks/useApi';

// Fix Leaflet default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const emergencyIcon = createCustomIcon('#ef4444'); // Red for emergencies
const resourceIcon = createCustomIcon('#2563eb');  // Blue for resources

// Center coordinates for Ahmedabad
const AHMEDABAD_CENTER = [23.0225, 72.5714];

// Helper to extract correct lat/lng from DB
const getCoordinates = (entity, index) => {
  // Check exact DB column names used in Dashboard (location_lat / location_lng)
  const lat = entity.location_lat ?? entity.latitude;
  const lng = entity.location_lng ?? entity.longitude;

  if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
    return [parseFloat(lat), parseFloat(lng)];
  }
  
  // Deterministic offset based on ID if coordinates are missing
  const idStr = entity.id || index.toString();
  const hash = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = ((hash % 100) - 50) * 0.0012;
  const lngOffset = (((hash * 13) % 100) - 50) * 0.0012;
  
  return [AHMEDABAD_CENTER[0] + latOffset, AHMEDABAD_CENTER[1] + lngOffset];
};

export default function MapPage() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch real incidents from dashboard overview (matching DashboardPage) and resources
  const { data: overview, isError: errIncidents } = useDashboardOverview();
  const { data: resources = [], isError: errResources } = useResources();

  if (errIncidents || errResources) {
    return (
      <PageContainer title="Geospatial Map View">
        <div className="flex flex-col items-center justify-center p-12 bg-red-50 border border-red-200 rounded-xl text-center my-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-red-700">Backend Disconnected</h3>
          <p className="text-sm text-red-600 max-w-md mt-1">
            Unable to connect to the backend server. Please make sure FastAPI is running.
          </p>
        </div>
      </PageContainer>
    );
  }

  const activeIncidents = overview?.incidents || [];
  const activeResources = Array.isArray(resources) ? resources : [];

  // Filter Incidents
  const filteredIncidents = activeIncidents.filter(inc => {
    const titleMatch = (inc.title || inc.incident_type || inc.description)?.toLowerCase().includes(searchQuery.toLowerCase());
    const locationMatch = (inc.address || inc.location_name)?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || locationMatch;
    
    const matchesType = filterType === 'all' || filterType === 'incidents';
    return matchesSearch && matchesType;
  });

  // Filter Resources
  const filteredResources = activeResources.filter(res => {
    const nameMatch = res.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = (res.category || res.type)?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || categoryMatch;
    
    const matchesType = filterType === 'all' || filterType === 'resources';
    return matchesSearch && matchesType;
  });

  const handleViewProfile = () => {
    if (!selectedItem) return;
    if (selectedItem.type === 'incident') {
      navigate(`/incidents/${selectedItem.data.id}`);
    } else {
      navigate(`/resources`);
    }
  };

  return (
    <PageContainer title="Geospatial Map View">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> Map Filters & Layers
            </h3>
            <div className="flex gap-2 mb-3">
              <Button 
                variant={filterType === 'all' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilterType('all')}
                className="flex-1 text-xs"
              >
                All
              </Button>
              <Button 
                variant={filterType === 'incidents' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilterType('incidents')}
                className="flex-1 text-xs"
              >
                Incidents
              </Button>
              <Button 
                variant={filterType === 'resources' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilterType('resources')}
                className="flex-1 text-xs"
              >
                Resources
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search location or team..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Active Entities ({filteredIncidents.length + filteredResources.length})
            </p>
            
            {/* Incidents List */}
            {(filterType === 'all' || filterType === 'incidents') && filteredIncidents.map((inc, idx) => (
              <div 
                key={`inc-list-${inc.id || idx}`}
                onClick={() => setSelectedItem({ type: 'incident', data: inc })}
                className="p-3 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> {inc.incident_type?.replace('_', ' ') || inc.title || 'Emergency'}
                  </span>
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    {inc.severity || 'High'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 truncate">{inc.address || inc.location_name || 'Ahmedabad Sector'}</p>
              </div>
            ))}

            {/* Resources List */}
            {(filterType === 'all' || filterType === 'resources') && filteredResources.map((res, idx) => (
              <div 
                key={`res-list-${res.id || idx}`}
                onClick={() => setSelectedItem({ type: 'resource', data: res })}
                className="p-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                    <Truck className="w-3 h-3" /> {res.name || res.type || res.category}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {res.status || 'Available'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 truncate">{res.current_location || 'Ahmedabad Base'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Map View Canvas */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative z-0">
          <MapContainer 
            center={AHMEDABAD_CENTER} 
            zoom={12} 
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Incident Markers */}
            {(filterType === 'all' || filterType === 'incidents') && filteredIncidents.map((inc, idx) => {
              const coords = getCoordinates(inc, idx);
              return (
                <Marker 
                  key={`marker-inc-${inc.id || idx}`} 
                  position={coords} 
                  icon={emergencyIcon}
                  eventHandlers={{ click: () => setSelectedItem({ type: 'incident', data: inc }) }}
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold text-sm text-red-600">{inc.incident_type || inc.title || 'Incident'}</p>
                      <p className="text-xs text-gray-600">Severity: {inc.severity || 'High'}</p>
                      <p className="text-xs text-gray-500">{inc.address || inc.location_name || 'Ahmedabad'}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Resource Markers */}
            {(filterType === 'all' || filterType === 'resources') && filteredResources.map((res, idx) => {
              const coords = getCoordinates(res, idx);
              return (
                <Marker 
                  key={`marker-res-${res.id || idx}`} 
                  position={coords} 
                  icon={resourceIcon}
                  eventHandlers={{ click: () => setSelectedItem({ type: 'resource', data: res }) }}
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold text-sm text-blue-600">{res.name}</p>
                      <p className="text-xs text-gray-600">Status: {res.status || 'Available'}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Details Overlay Popup */}
          {selectedItem && (
            <div className="absolute bottom-4 right-4 z-[1000] bg-white p-4 rounded-xl shadow-lg border border-gray-200 max-w-sm w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {selectedItem.type === 'incident' ? 'INCIDENT DETAILS' : 'RESOURCE DETAILS'}
                </span>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">
                {selectedItem.data.incident_type || selectedItem.data.title || selectedItem.data.name}
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                {selectedItem.type === 'incident' 
                  ? (selectedItem.data.description || selectedItem.data.address || 'Active Emergency')
                  : `Type: ${selectedItem.data.type || selectedItem.data.category || 'General'} | Status: ${selectedItem.data.status}`
                }
              </p>
              <Button size="sm" onClick={handleViewProfile} className="w-full text-xs">
                View Full Profile
              </Button>
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  );
}
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  ShieldAlert, 
  Download
} from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { 
  useAnalyticsIncidentTypes, 
  useAnalyticsResponseDelays, 
  useAnalyticsResourceShortages, 
  useAnalyticsHotspots 
} from '../hooks/useApi';

// Color Palette for Charts
const COLORS = {
  primary: '#2563eb',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  gray: '#6b7280',
};

const INCIDENT_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

  // Fetch data using your custom API hooks
  const { data: incidentTypes } = useAnalyticsIncidentTypes();
  const { data: responseDelays } = useAnalyticsResponseDelays();
  const { data: resourceShortages } = useAnalyticsResourceShortages();
  const { data: hotspots } = useAnalyticsHotspots(2);

  // Fallbacks if backend responses are empty or loading
  const emergencyTypesData = incidentTypes || [
    { name: 'Fire / Explosion', count: 42 },
    { name: 'Medical Emergency', count: 35 },
    { name: 'Natural Disaster', count: 20 },
    { name: 'Industrial Accident', count: 13 },
    { name: 'Road Incident', count: 10 },
  ];

  const responseDelayData = responseDelays || [
    { day: 'Mon', avgDelayMinutes: 8.5, targetMinutes: 10 },
    { day: 'Tue', avgDelayMinutes: 12.2, targetMinutes: 10 },
    { day: 'Wed', avgDelayMinutes: 9.1, targetMinutes: 10 },
    { day: 'Thu', avgDelayMinutes: 14.8, targetMinutes: 10 },
    { day: 'Fri', avgDelayMinutes: 11.0, targetMinutes: 10 },
    { day: 'Sat', avgDelayMinutes: 7.4, targetMinutes: 10 },
    { day: 'Sun', avgDelayMinutes: 6.8, targetMinutes: 10 },
  ];

  const resourceShortagesData = resourceShortages || [
    { category: 'Ambulances', available: 8, required: 15 },
    { category: 'Fire Trucks', available: 12, required: 14 },
    { category: 'Hazmat Teams', available: 3, required: 6 },
    { category: 'Rescue Boats', available: 5, required: 5 },
    { category: 'Air Support', available: 1, required: 3 },
  ];

  const affectedAreasData = hotspots || [
    { area: 'Downtown Sector A', incidents: 38, riskLevel: 'High' },
    { area: 'Industrial Park Zone 3', incidents: 29, riskLevel: 'High' },
    { area: 'North River Basin', incidents: 21, riskLevel: 'Medium' },
    { area: 'East Highway Junction', incidents: 18, riskLevel: 'Medium' },
    { area: 'West Suburbs', incidents: 9, riskLevel: 'Low' },
  ];

  return (
    <PageContainer title="Emergency Operational Analytics">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">
            Real-time statistical evaluation of incident frequencies, response times, and resource allocations.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-36"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter</option>
          </Select>

          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Total Incidents</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900">120</h3>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3" /> -12% vs last period
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Avg Response Time</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900">9.9 min</h3>
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" /> +1.2 min peak delay
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Critical Shortages</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900">14 units</h3>
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3 h-3" /> Ambulances & Hazmat
              </p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Primary Hotspot</p>
              <h3 className="text-lg font-bold mt-1 text-gray-900 truncate">Downtown A</h3>
              <p className="text-xs text-gray-500 mt-1">38 Incidents Reported</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <MapPin className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* 1. Emergency Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" /> Emergency Types Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emergencyTypesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {emergencyTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={INCIDENT_COLORS[index % INCIDENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Incidents`, 'Frequency']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Response Delay Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" /> Response Delays (Average vs Target)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseDelayData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis unit=" min" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgDelayMinutes" 
                    name="Avg Response Time" 
                    stroke={COLORS.danger} 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="targetMinutes" 
                    name="SLA Target Time" 
                    stroke={COLORS.success} 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Resource Shortages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" /> Resource Availability vs Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceShortagesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="available" name="Available Units" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="required" name="Required Units" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 4. Frequently Affected Areas (Hotspots) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" /> Frequently Affected Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {affectedAreasData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-400 w-4">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.area}</p>
                      <p className="text-xs text-gray-500">{item.incidents} Incidents logged</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      item.riskLevel === 'High' 
                        ? 'destructive' 
                        : item.riskLevel === 'Medium' 
                        ? 'warning' 
                        : 'secondary'
                    }
                  >
                    {item.riskLevel} Risk
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </PageContainer>
  );
}
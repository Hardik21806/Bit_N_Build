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
  const { data: incidentTypes, isError: err1, isLoading: load1 } = useAnalyticsIncidentTypes();
  const { data: responseDelays, isError: err2, isLoading: load2 } = useAnalyticsResponseDelays();
  const { data: resourceShortages, isError: err3, isLoading: load3 } = useAnalyticsResourceShortages();
  const { data: hotspots, isError: err4, isLoading: load4 } = useAnalyticsHotspots(2);

  // If backend is shut down or unreachable, show error banner instead of mock data
  const isBackendDown = err1 || err2 || err3 || err4;

  if (isBackendDown) {
    return (
      <PageContainer title="Emergency Operational Analytics">
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

  // Pure DB data (empty array while loading or if table has 0 rows)
  const emergencyTypesData = incidentTypes || [];
  const responseDelayData = responseDelays || [];
  const resourceShortagesData = resourceShortages || [];
  const affectedAreasData = hotspots || [];

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
              {affectedAreasData.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No hotspot data found in database.</p>
              ) : (
                affectedAreasData.map((item, idx) => (
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
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </PageContainer>
  );
}
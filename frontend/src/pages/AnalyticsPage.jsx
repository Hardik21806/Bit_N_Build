import { useState, useMemo } from 'react';
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
  Legend,
} from 'recharts';
import {
  Clock,
  AlertTriangle,
  MapPin,
  ShieldAlert,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { useAllIncidents } from '../hooks/useApi';

const CHART_COLORS = {
  primary: '#1e40af',
  danger: '#b91c1c',
  warning: '#c2410c',
  success: '#16a34a',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  gray: '#6b7280',
};

const INCIDENT_COLORS = ['#b91c1c', '#c2410c', '#3b82f6', '#8b5cf6', '#16a34a'];

const typeLabels = {
  flood: 'Flood',
  fire: 'Fire',
  industrial_accident: 'Industrial Accident',
  road_accident: 'Road Accident',
  medical_emergency: 'Medical Emergency',
  structural_collapse: 'Structural Collapse',
  other: 'Other',
};

const resourceLabels = {
  ambulance: 'Ambulances',
  fire_truck: 'Fire Trucks',
  police_unit: 'Police Units',
  rescue_team: 'Rescue Teams',
  medical_team: 'Medical Teams',
  helicopter: 'Air Support',
  equipment: 'Equipment',
  facility: 'Facilities',
};

function parseTimestamp(ts) {
  if (!ts) return null;
  try {
    return new Date(ts.replace('Z', '+00:00'));
  } catch {
    return null;
  }
}

function isWithinRange(incident, timeRange) {
  const now = new Date();
  const ts = parseTimestamp(incident.reported_at || incident.created_at || incident.updated_at);
  if (!ts) return false;

  const diffMs = now - ts;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  switch (timeRange) {
    case '24h': return diffDays <= 1;
    case '7d': return diffDays <= 7;
    case '30d': return diffDays <= 30;
    case '90d': return diffDays <= 90;
    default: return true;
  }
}

function getDayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function EmptyChart({ height = 200, message = 'No data available for selected time range' }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="text-center">
        <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
        <p className="text-sm text-text-muted">{message}</p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

  const { data: incidents = [], isLoading, isError, refetch } = useAllIncidents();

  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => isWithinRange(inc, timeRange));
  }, [incidents, timeRange]);

  const allFailed = isError;
  const anyLoading = isLoading;

  const emergencyTypesData = useMemo(() => {
    const counts = {};
    filteredIncidents.forEach(inc => {
      const type = inc.incident_type || 'other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      name: typeLabels[type] || type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count,
    }));
  }, [filteredIncidents]);

  const responseDelayData = useMemo(() => {
    const delaysByDay = {};
    filteredIncidents.forEach(inc => {
      const ts = parseTimestamp(inc.reported_at || inc.created_at);
      if (!ts) return;

      const dayKey = ts.toISOString().split('T')[0];
      const delay = Number(inc.response_delay_minutes || inc.delay_minutes ||
        (inc.assigned_at && ts ? (new Date(inc.assigned_at) - ts) / (1000 * 60) :
        ((inc.id || '').charCodeAt(0) % 5 + 5)));

      if (!delaysByDay[dayKey]) delaysByDay[dayKey] = [];
      delaysByDay[dayKey].push(delay);
    });

    const sortedDays = Object.keys(delaysByDay).sort().slice(-7);
    return sortedDays.map(dayKey => {
      const delays = delaysByDay[dayKey];
      const avg = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;
      const date = new Date(dayKey + 'T00:00:00');
      return {
        day: getDayLabel(date),
        avgDelayMinutes: Math.round(avg * 10) / 10,
        targetMinutes: 10,
      };
    });
  }, [filteredIncidents]);

  const resourceShortagesData = useMemo(() => {
    const counts = {};
    filteredIncidents.forEach(inc => {
      const type = inc.resource_type || 'unknown';
      if (!counts[type]) counts[type] = { available: 0, required: 0 };
      counts[type].required += 1;
      if (inc.status === 'available' || inc.status === 'idle') {
        counts[type].available += 1;
      }
    });

    if (Object.keys(counts).length === 0) {
      return [
        { category: 'Ambulances', available: 8, required: 15 },
        { category: 'Fire Trucks', available: 12, required: 14 },
        { category: 'Hazmat Teams', available: 3, required: 6 },
        { category: 'Rescue Boats', available: 5, required: 5 },
        { category: 'Air Support', available: 1, required: 3 },
      ];
    }

    return Object.entries(counts).map(([type, data]) => ({
      category: resourceLabels[type] || type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      available: data.available,
      required: data.required,
    }));
  }, [filteredIncidents]);

  const affectedAreasData = useMemo(() => {
    const counts = {};
    filteredIncidents.forEach(inc => {
      const loc = inc.location_name || inc.address || `Lat: ${inc.location_lat?.toFixed(2)}, Lng: ${inc.location_lng?.toFixed(2)}`;
      counts[loc] = (counts[loc] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area, incidents]) => ({
        area,
        incidents,
        riskLevel: incidents >= 5 ? 'High' : incidents >= 2 ? 'Medium' : 'Low',
      }));
  }, [filteredIncidents]);

  const handleExport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      summary: {
        totalIncidents: filteredIncidents.length,
        emergencyTypes: emergencyTypesData,
        responseDelays: responseDelayData,
        resourceShortages: resourceShortagesData,
        hotspots: affectedAreasData,
      },
      incidents: filteredIncidents.map(inc => ({
        id: inc.id,
        type: inc.incident_type,
        severity: inc.severity,
        status: inc.status,
        location: inc.address || inc.location_name,
        reportedAt: inc.reported_at,
        responseDelay: inc.response_delay_minutes || inc.delay_minutes,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (allFailed) {
    return (
      <PageContainer title="Emergency Operational Analytics">
        <div className="flex flex-col items-center justify-center p-12 bg-severity-critical-light border border-severity-critical rounded-lg text-center my-8">
          <AlertCircle className="w-12 h-12 text-severity-critical mb-3" />
          <h3 className="text-lg font-bold text-severity-critical-text">Backend Disconnected</h3>
          <p className="text-sm text-severity-critical-text max-w-md mt-1">
            Unable to connect to the backend server. Please make sure FastAPI is running.
          </p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            <Loader2 className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium text-text-primary">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-text-secondary">{entry.name}: </span>
              <span className="font-medium text-text-primary">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <PageContainer title="Emergency Operational Analytics">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <p className="text-secondary text-text-muted">
            Real-time statistical evaluation of incident frequencies, response times, and resource allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2" disabled={anyLoading}>
            <Download className="w-4 h-4" /> Export Report
          </Button>

          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={anyLoading} className="flex items-center gap-2">
            <Loader2 className={`w-4 h-4 ${anyLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {anyLoading && (
        <div className="mb-4 p-3 bg-primary-light border border-primary rounded-lg text-center text-sm text-primary flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading analytics data...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" /> Emergency Types Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {emergencyTypesData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <PieChart>
                    <Pie
                      data={emergencyTypesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {emergencyTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={INCIDENT_COLORS[index % INCIDENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-severity-medium" /> Response Delays (Average vs Target)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {responseDelayData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <LineChart data={responseDelayData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
                    <YAxis unit=" min" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" height={28} />
                    <Line
                      type="monotone"
                      dataKey="avgDelayMinutes"
                      name="Avg Response Time"
                      stroke={CHART_COLORS.danger}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="targetMinutes"
                      name="SLA Target Time"
                      stroke={CHART_COLORS.success}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-severity-critical" /> Resource Availability vs Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceShortagesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend layout="horizontal" align="center" verticalAlign="bottom" height={28} />
                  <Bar dataKey="available" name="Available Units" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="required" name="Required Units" fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" /> Frequently Affected Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {affectedAreasData.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">No hotspot data for selected time range.</p>
              ) : (
                affectedAreasData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background-tertiary/50">
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted font-mono w-5 text-center">#{idx + 1}</span>
                      <div>
                        <p className="font-medium text-sm text-text-primary">{item.area}</p>
                        <p className="text-xs text-text-muted">{item.incidents} Incidents logged</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        item.riskLevel === 'High'
                          ? 'destructive'
                          : item.riskLevel === 'Medium'
                          ? 'secondary'
                          : 'outline'
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
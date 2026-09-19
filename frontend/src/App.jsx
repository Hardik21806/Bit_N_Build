import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './lib/queryClient';
import { TooltipProvider } from './components/ui';
import { Layout } from './components/layout';
import { useDashboardWebSocket } from './hooks';
import { PageLoading } from './components/ui/States';

function DashboardPage() {
  return <div>Dashboard Page</div>;
}

function IncidentsPage() {
  return <div>Incidents Page</div>;
}

function ReportIncidentPage() {
  return <div>Report Incident Page</div>;
}

function ResourcesPage() {
  return <div>Resources Page</div>;
}

function AssignmentsPage() {
  return <div>Assignments Page</div>;
}

function MapPage() {
  return <div>Map Page</div>;
}

function AnalyticsPage() {
  return <div>Analytics Page</div>;
}

function AlertsPage() {
  return <div>Alerts Page</div>;
}

function SettingsPage() {
  return <div>Settings Page</div>;
}

function AppContent() {
  useDashboardWebSocket();
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/incidents/report" element={<ReportIncidentPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryProvider>
  );
}

export default App;
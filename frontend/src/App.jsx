import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './lib/queryClient';
import { TooltipProvider } from './components/ui';
import { Layout } from './components/layout';
import { useDashboardWebSocket } from './hooks';
import { 
  DashboardPage, 
  IncidentsPage, 
  ResourcesPage, 
  ReportIncidentPage, 
  IncidentDetailPage,
  AnalyticsPage,
  MapPage,
  AssignmentsPage
} from './pages';

function AlertsPage() {
  return <div className="p-4">Alerts Page - Coming Soon</div>;
}

function SettingsPage() {
  return <div className="p-4">Settings Page - Coming Soon</div>;
}

function AppContent() {
  useDashboardWebSocket();
  
  return (
    <Routes>
      <Route path="/" element={<Layout><DashboardPage /></Layout>} />
      <Route path="/incidents" element={<Layout><IncidentsPage /></Layout>} />
      <Route path="/incidents/report" element={<Layout><ReportIncidentPage /></Layout>} />
      <Route path="/incidents/:id" element={<Layout><IncidentDetailPage /></Layout>} />
      <Route path="/resources" element={<Layout><ResourcesPage /></Layout>} />
      <Route path="/assignments" element={<Layout><AssignmentsPage /></Layout>} />
      <Route path="/map" element={<Layout><MapPage /></Layout>} />
      <Route path="/analytics" element={<Layout><AnalyticsPage /></Layout>} />
      <Route path="/alerts" element={<Layout><AlertsPage /></Layout>} />
      <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
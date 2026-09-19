# PS-9 — Intelligent Emergency Response & Resource Coordination Platform (Frontend)

React + Vite + TailwindCSS frontend for the emergency response platform. Covers all deliverables: multi-source incident reporting, AI-powered classification display, duplicate detection UI, real-time dashboard with WebSocket updates, resource recommendation/assignment, alerts & escalation, AI summaries, analytics, and notifications.

---

## 1. Tech Stack

| Category | Choice | Rationale |
|----------|--------|-----------|
| Framework | **React 19** (Vite) | Fast HMR, small bundle, modern hooks |
| Styling | **TailwindCSS v4** | Utility-first, zero-config, dark mode built-in |
| Routing | **React Router v7** | File-based routes, loaders, SSR-ready |
| State (server) | **TanStack Query v5** | Caching, deduping, background refetch, mutations |
| State (client) | **Zustand** | Lightweight global UI state (sidebar, filters, toasts) |
| Maps | **react-leaflet + Leaflet** | Open-source, OSM tiles, marker clustering |
| Charts | **Recharts** | Composable, responsive, Tailwind-friendly |
| WebSocket | Native `WebSocket` + custom hook | Zero-dep, auto-reconnect, event-based |
| Forms | **React Hook Form + Zod** | Validation, type-safe schemas |
| Notifications | **Sonner** | Toast system, accessible, promise-based |
| Icons | **lucide-react** | Tree-shakable, consistent 24px stroke |
| Date/Time | **date-fns** | Lightweight, immutable, timezone-aware |
| HTTP | **fetch wrapper** (src/api/client.js) | Centralized error handling, auth interceptors |
| Testing | **Vitest + React Testing Library** | Fast, Vite-native, component-focused |

---

## 2. Project Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                    # API layer (auto-generated from OpenAPI ideal)
│   │   ├── client.js           # fetch wrapper + error normalization
│   │   ├── incidents.js        # Incident CRUD, classification, merge, summary
│   │   ├── resources.js        # Resources CRUD, recommend, assign
│   │   ├── dashboard.js        # Overview, alerts, WebSocket hook
│   │   └── analytics.js        # All analytics endpoints
│   ├── components/
│   │   ├── ui/                 # Reusable primitives (Button, Card, Modal, etc.)
│   │   ├── layout/             # Sidebar, Header, Footer, PageShell
│   │   ├── maps/               # IncidentMap, ResourceMap, ClusterMarkers
│   │   ├── charts/             # SeverityChart, TypeChart, DelayChart, HotspotChart
│   │   ├── forms/              # IncidentReportForm, ResourceForm, AssignmentModal
│   │   ├── incidents/          # IncidentCard, IncidentList, IncidentDetail, DuplicateBanner
│   │   ├── resources/          # ResourceCard, ResourceTable, RecommendationPanel
│   │   ├── alerts/             # AlertBanner, AlertList, EscalationToast
│   │   └── ai/                 # AISummaryCard, AIRecommendationsCard
│   ├── hooks/
│   │   ├── useDashboardSocket.js      # WebSocket connection + event handling
│   │   ├── useIncidents.js            # TanStack Query hooks for incidents
│   │   ├── useResources.js            # TanStack Query hooks for resources
│   │   ├── useAnalytics.js            # TanStack Query hooks for analytics
│   │   ├── useDebounce.js             # Debounced search/filter
│   │   └── useMediaQuery.js           # Responsive breakpoints
│   ├── store/
│   │   ├── uiStore.js         # Sidebar, modals, toasts, theme
│   │   └── filterStore.js     # Dashboard filters (status, severity, type, date)
│   ├── pages/
│   │   ├── Dashboard.jsx      # Live overview + map + alerts (main ops view)
│   │   ├── Incidents.jsx      # List + filters + create modal
│   │   ├── IncidentDetail.jsx # Full detail, AI summary, recommendations, assign
│   │   ├── Resources.jsx      # Resource registry + status management
│   │   ├── Analytics.jsx      # Charts + hotspot map + export
│   │   ├── ReportIncident.jsx # Public-facing citizen report form
│   │   ├── Settings.jsx       # User prefs, notification channels
│   │   └── Login.jsx          # Auth (if needed later)
│   ├── utils/
│   │   ├── format.js          # formatDistance, formatRelativeTime, severityColor
│   │   ├── validation.js      # Zod schemas mirroring backend
│   │   ├── mapHelpers.js      # bounds, clustering, icon factories
│   │   └── export.js          # CSV/PDF export helpers
│   ├── styles/
│   │   └── index.css          # Tailwind imports + custom utilities
│   ├── App.jsx                # Router + providers + global listeners
│   └── main.jsx               # Entry point
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js         # Optional: custom theme tokens
├── .env                       # VITE_API_BASE_URL, VITE_WS_URL
└── README.md
```

---

## 3. Required Pages & Features (Mapped to PS Deliverables)

### 3.1 Incident Collection — `/report` (Public) + `/incidents` (Ops)

**Pages:**
- `ReportIncident.jsx` — Citizen-facing form: source selector, description (textarea), map picker (click to set lat/lng), optional contact, photo upload (future). Submits to `POST /incidents`.
- `Incidents.jsx` — Ops list view: paginated table with filters (status, severity, type, source, date range), search by description/address, "Create Incident" button opening same form in modal.

**Components:**
- `IncidentReportForm` — React Hook Form + Zod schema matching `IncidentCreate`.
- `MapPicker` — Leaflet map with click-to-place marker, reverse geocode for address.
- `SourceBadge` — Colored pill for source (citizen, sensor, call, field, hospital, gov).
- `DuplicateBanner` — Shows "Potential duplicate of INC-123" with "View / Merge" actions when `duplicate_of` exists.

### 3.2 Incident Classification Display

**Backend does classification; frontend displays:**
- `IncidentCard` / `IncidentDetail` show: **Type** (icon + label), **Severity** (colored badge: low=green, medium=yellow, high=orange, critical=red pulse), **Priority** (P1–P4), **Confidence** (percentage, low confidence gets ⚠️ tooltip).
- `AISummaryCard` — Renders `ai_summary` (markdown) + "Regenerate" button calling `GET /incidents/{id}/summary`.
- `AIRecommendationsCard` — Renders `ai_recommendations` as actionable checklist.

### 3.3 Duplicate Detection & Consolidation

- On incident create, backend returns `duplicate_of` if merged. Frontend shows `DuplicateBanner` on master incident.
- `IncidentDetail` has "Merge Manually" button → opens modal with searchable list of similar incidents (same type, nearby, recent) → calls `POST /incidents/{id}/merge`.
- Consolidated incident shows `report_count` badge and merged sources list.

### 3.4 Resource Recommendation & Assignment

**Pages:**
- `IncidentDetail.jsx` — Right panel: `RecommendationPanel` fetches `GET /resources/recommend/{incident_id}` on mount.
- `Resources.jsx` — Full registry: table with type, status, location, capacity. Inline status toggle (Available/Dispatched/Maintenance).

**Components:**
- `RecommendationPanel` — Lists recommended resources with distance, ETA, capability match. Each row has "Assign" button → opens `AssignmentModal` (ETA input) → calls `POST /resources/assign`.
- `AssignmentModal` — Shows resource details, incident summary, ETA field (prefilled from recommendation).
- `ResourceCard` — Map marker popup + table row: type icon, status dot, capacity, contact.
- Real-time: WebSocket `resource_assigned` event updates local assignment list without refetch.

### 3.5 Real-Time Monitoring Dashboard — `/` (Default)

**Layout:** Three-panel responsive grid (collapsible on mobile).

| Panel | Content |
|-------|---------|
| **Left (30%)** | `ActiveIncidentsList` — Virtualized list of active incidents (status ≠ resolved/closed/duplicate). Each row: type icon, severity badge, address, time ago, assigned team count. Click → opens `IncidentDetail` in right panel or modal. |
| **Center (40%)** | `IncidentMap` — Leaflet map with clustered markers. Color by severity. Click marker → highlights in list. Toggle layers: incidents, resources, heatmap. |
| **Right (30%)** | Top: `AlertBanner` (critical/escalation count). Middle: `AlertList` — active alerts from `GET /dashboard/alerts`, each with "Acknowledge" button (`PATCH /dashboard/alerts/{id}/acknowledge`). Bottom: `SeverityChart` (donut) + `StatusChart` (bar). |

**Real-time:** `useDashboardSocket` subscribes to `incident_created`, `incident_updated`, `incident_consolidated`, `incident_escalated`, `resource_assigned`. Updates TanStack Query cache via `queryClient.setQueryData` for instant UI sync.

### 3.6 Alerts & Escalation

- `AlertBanner` — Persistent top bar (red) when any `critical_incident` or `escalation` alert is active. Shows count, "View All" links to Alerts panel.
- `AlertList` — Filterable (active/acknowledged/resolved), sortable by time. Row: type icon, message, incident link, time, acknowledge button.
- `EscalationToast` — Sonner toast triggered by WebSocket `incident_escalated` event: "INC-456 escalated — SLA breached" with "Open" action.

### 3.7 AI Assistance

- `AISummaryCard` — Incident detail tab: "AI Summary" (markdown render), confidence badge, "Regenerate" button.
- `AIRecommendationsCard` — "AI Recommendations" tab: structured list (Immediate Actions, Resource Needs, Safety Considerations, Coordination Notes). Each item has checkbox for tracking.
- `IncidentDetail` — "Ask AI" button (future) → opens chat modal context-aware to incident.

### 3.8 Analytics — `/analytics`

**Tabs + Charts (Recharts + responsive containers):**

| Tab | Endpoint | Visualization |
|-----|----------|---------------|
| **Incident Types** | `/analytics/incident-types` | Horizontal bar chart, sortable, click filters dashboard |
| **Response Delays** | `/analytics/response-delays` | Histogram (buckets: <15m, 15-30m, 30-60m, 1h+), KPI cards: avg delay, SLA breaches |
| **Resource Shortages** | `/analytics/resource-shortages` | Grouped bar: available vs dispatched vs maintenance per type. Highlight zero-availability types in red. |
| **Hotspots** | `/analytics/hotspots` | `HotspotMap` — Leaflet with circle markers (radius ∝ incident_count), tooltip with count. Top 15 table below. |

**Controls:** Date range picker (last 7d/30d/90d/custom), export CSV button per tab.

### 3.9 Notifications

- **In-app:** Sonner toasts for all mutations (create, assign, acknowledge), WebSocket events (escalation, new critical).
- **Email (backend-driven):** Frontend shows "Notification sent" badge on incident detail when `notifications_log` entry exists (future: fetch log).
- **Settings page:** User preference toggles (email, push, in-app) per alert type — stored in localStorage, sent to backend on profile update.

---

## 4. API Integration Layer (`src/api/`)

### 4.1 Centralized Client (`client.js`)

```js
// src/api/client.js
const BASE = import.meta.env.VITE_API_BASE_URL;

export async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || data.error || 'Request failed');
    err.status = res.status;
    err.detail = data.detail;
    throw err;
  }
  return data;
}

export const get = (path) => api(path);
export const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });
export const patch = (path, body) => api(path, { method: 'PATCH', body: JSON.stringify(body) });
export const del = (path) => api(path, { method: 'DELETE' });
```

### 4.2 Domain Modules (example: `incidents.js`)

```js
// src/api/incidents.js
import { get, post, patch } from './client';

export const createIncident = (payload) => post('/incidents', payload);
export const listIncidents = (params) => get(`/incidents?${new URLSearchParams(params)}`);
export const getIncident = (id) => get(`/incidents/${id}`);
export const updateIncident = (id, payload) => patch(`/incidents/${id}`, payload);
export const mergeIncidents = (id, masterId) => post(`/incidents/${id}/merge`, { master_id: masterId });
export const getIncidentSummary = (id) => get(`/incidents/${id}/summary`);
```

All modules follow this pattern. Use in TanStack Query hooks.

---

## 5. Real-Time WebSocket (`src/hooks/useDashboardSocket.js`)

```js
// src/hooks/useDashboardSocket.js
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const EVENT_HANDLERS = {
  incident_created: (data, qc) => {
    qc.setQueryData(['dashboardOverview'], (old) => ({
      ...old,
      active_emergencies: old.active_emergencies + 1,
      incidents: [data, ...old.incidents],
    }));
  },
  incident_updated: (data, qc) => {
    qc.setQueryData(['dashboardOverview'], (old) => ({
      ...old,
      incidents: old.incidents.map((i) => (i.id === data.id ? data : i)),
    }));
    qc.setQueryData(['incident', data.id], data);
  },
  incident_consolidated: (data, qc) => {
    qc.invalidateQueries({ queryKey: ['dashboardOverview'] });
    qc.invalidateQueries({ queryKey: ['incident', data.id] });
  },
  resource_assigned: (data, qc) => {
    qc.invalidateQueries({ queryKey: ['assignments', data.incident_id] });
    qc.invalidateQueries({ queryKey: ['resources'] });
  },
  incident_escalated: (data, qc) => {
    // Toast handled in component via event listener
    window.dispatchEvent(new CustomEvent('escalation', { detail: data }));
  },
};

export function useDashboardSocket() {
  const qc = useQueryClient();
  const wsRef = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);
    wsRef.current = ws;

    ws.onmessage = (msg) => {
      const { event, data } = JSON.parse(msg.data);
      const handler = EVENT_HANDLERS[event];
      if (handler) handler(data, qc);
    };

    ws.onclose = () => {
      reconnectTimeout.current = setTimeout(connect, 2000);
    };
    ws.onerror = () => ws.close();
  }, [qc]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);
}
```

**Usage:** Call `useDashboardSocket()` once in `Dashboard.jsx` or root layout.

---

## 6. State Management

### 6.1 Server State — TanStack Query

```js
// src/hooks/useIncidents.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/incidents';

export function useIncidents(filters = {}) {
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: () => api.listIncidents(filters),
    staleTime: 30_000,
  });
}

export function useIncident(id) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => api.getIncident(id),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createIncident,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  });
}
```

Similar hooks for resources, dashboard, analytics.

### 6.2 Client State — Zustand

```js
// src/store/uiStore.js
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  theme: 'system',
  setTheme: (t) => set({ theme: t }),
  toasts: [],
  addToast: (toast) => set((s) => ({ toasts: [...s.toasts, { ...toast, id: Date.now() }] })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// src/store/filterStore.js
export const useFilterStore = create((set) => ({
  status: null,
  severity: null,
  type: null,
  dateRange: { from: null, to: null },
  setFilters: (f) => set(f),
  clearFilters: () => set({ status: null, severity: null, type: null, dateRange: { from: null, to: null } }),
}));
```

---

## 7. Maps Integration (`src/components/maps/`)

### 7.1 IncidentMap (Dashboard Center Panel)

```jsx
// src/components/maps/IncidentMap.jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import severityIcon from '../utils/severityIcon'; // returns L.Icon per severity

export function IncidentMap({ incidents, selectedId, onSelect }) {
  const bounds = useMemo(() => {
    if (!incidents.length) return null;
    const coords = incidents.map((i) => [i.location_lat, i.location_lng]);
    return coords;
  }, [incidents]);

  return (
    <MapContainer
      center={bounds ? bounds[0] : [23.03, 72.58]}
      zoom={bounds ? 10 : 5}
      className="h-full w-full rounded-lg"
      options={{ maxZoom: 18 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      {incidents.map((inc) => (
        <Marker
          key={inc.id}
          position={[inc.location_lat, inc.location_lng]}
          icon={severityIcon(inc.severity)}
          eventHandlers={{
            click: () => onSelect(inc.id),
          }}
        >
          <Popup>
            <strong>{inc.incident_type?.toUpperCase()}</strong> — {inc.severity}
            <br />
            <small>{inc.address || `${inc.location_lat.toFixed(4)}, ${inc.location_lng.toFixed(4)}`}</small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

### 7.2 Severity Icons (`src/utils/severityIcon.js`)

```js
import L from 'leaflet';

const baseIcon = (color) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const severityIcon = (severity) => {
  switch (severity) {
    case 'critical': return baseIcon('#dc2626'); // red-600
    case 'high': return baseIcon('#f97316');     // orange-500
    case 'medium': return baseIcon('#eab308');   // yellow-500
    case 'low': return baseIcon('#22c55e');      // green-500
    default: return baseIcon('#6b7280');         // gray-500
  }
};
```

### 7.3 HotspotMap (Analytics)

Uses `circleMarker` with radius scaled by `Math.sqrt(count) * 4`, color gradient by count.

---

## 8. Charts (`src/components/charts/`)

All charts use `ResponsiveContainer` (100% width/height), `Recharts` primitives, Tailwind for tooltips.

```jsx
// src/components/charts/SeverityChart.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SEVERITY_COLORS = { critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e' };

export function SeverityChart({ data }) {
  const entries = Object.entries(data || {});
  if (!entries.length) return <div className="h-48 flex items-center justify-center text-muted-foreground">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={entries.map(([name, value]) => ({ name, value }))}
          cx="50%" cy="50%" innerRadius={60} outerRadius={100}
          paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {entries.map(([name], i) => (
            <Cell key={name} fill={SEVERITY_COLORS[name] || '#6b7280'} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [v, 'incidents']} contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }} />
        <Legend layout="vertical" align="right" verticalAlign="middle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

Other charts: `TypeChart` (BarChart horizontal), `DelayChart` (Histogram/BarChart), `StatusChart` (StackedBarChart), `HotspotChart` (Table + Map).

---

## 9. UI/UX Design System

### 9.1 Color Palette (Tailwind Config)

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        emergency: {
          50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 900: '#7f1d1d',
        },
        warning: { 500: '#f97316', 600: '#ea580c' },
        caution: { 500: '#eab308', 600: '#ca8a04' },
        safe: { 500: '#22c55e', 600: '#16a34a' },
        surface: { 900: '#111827', 800: '#1f2937', 700: '#374151' },
      },
    },
  },
};
```

### 9.2 Severity Visual Language

| Severity | Badge | Marker | Border | Pulse |
|----------|-------|--------|--------|-------|
| Critical | `bg-emergency-600 text-white animate-pulse` | Red dot + ring | `border-emergency-600` | Yes |
| High | `bg-warning-600 text-white` | Orange dot | `border-warning-600` | No |
| Medium | `bg-caution-600 text-black` | Yellow dot | `border-caution-600` | No |
| Low | `bg-safe-600 text-white` | Green dot | `border-safe-600` | No |

### 9.3 Component Primitives (`src/components/ui/`)

- `Button` — variants: primary, secondary, danger, ghost, link; sizes: sm, md, lg; loading state.
- `Card` — header, content, footer slots; hoverable variant.
- `Modal` — Portal, focus trap, ESC close, backdrop click close.
- `Badge` — severity-aware variants.
- `Select` / `MultiSelect` — searchable, keyboard nav.
- `DataTable` — sorting, pagination, row selection, virtualized (`@tanstack/react-virtual`).
- `Toast` — Sonner wrapper with `toast.promise()` for mutations.

### 9.4 Dark Mode

- `class="dark"` on `<html>` via `useUIStore` theme setter.
- All colors use `dark:` variants; maps use dark tile layer (`cartodb-dark-matter`) when dark.

---

## 10. Responsive Breakpoints

| Breakpoint | Layout Adjustments |
|------------|-------------------|
| `< 640px` (mobile) | Dashboard stacks: Map top (300px), List below, Alerts bottom. Sidebar → drawer. Tables → card list. |
| `640–1024px` (tablet) | Two-column: Map + List side-by-side, Alerts collapsible panel. |
| `> 1024px` (desktop) | Three-panel grid. Persistent sidebar. |
| `> 1440px` (wide) | Max-width container 1600px, extra padding. |

Use `useMediaQuery('(min-width: 1024px)')` hook for conditional rendering.

---

## 11. Accessibility (WCAG 2.1 AA)

- Semantic HTML: `<main>`, `<nav>`, `<section>`, `<article>`, headings hierarchy.
- Focus visible: `focus-visible:ring-2 focus-visible:ring-emergency-500`.
- ARIA: `aria-live="polite"` on toast container, `aria-label` on icon buttons, `role="alert"` on escalation toasts.
- Color contrast: All text ≥ 4.5:1; severity badges use both color + icon/text.
- Keyboard: All interactive elements reachable; modals trap focus; map markers keyboard-navigable (custom implementation or use `react-leaflet` keyboard support).
- Reduced motion: `@media (prefers-reduced-motion)` disables pulse animations.

---

## 12. Development Workflow

### 12.1 Environment Setup

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/dashboard
```

### 12.2 Commands

```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint
npm run test       # Vitest
npm run test:ui    # Vitest UI
```

### 12.3 Git Hooks (Husky + lint-staged)

```json
// package.json
"husky": { "hooks": { "pre-commit": "lint-staged" } },
"lint-staged": { "*.{js,jsx}": ["eslint --fix", "prettier --write"] }
```

### 12.4 Backend Contract Testing

- Backend exposes OpenAPI at `/openapi.json`.
- Generate types: `npx openapi-typescript http://localhost:8000/openapi.json -o src/api/types.d.ts`.
- Use generated types in `src/api/*.js` for compile-time safety.

---

## 13. Implementation Priority (Suggested Sprint Order)

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| **1** | Foundation | Project setup, routing, providers, UI primitives, Tailwind theme, API client, TanStack Query setup |
| **2** | Incident Collection & List | `ReportIncident` page, `Incidents` list with filters, `IncidentCard`, map picker, form validation |
| **3** | Dashboard + Real-time | `Dashboard` layout, `IncidentMap`, `ActiveIncidentsList`, WebSocket hook, live updates |
| **4** | Incident Detail + AI | `IncidentDetail` page, `AISummaryCard`, `AIRecommendationsCard`, duplicate banner, merge modal |
| **5** | Resources + Assignment | `Resources` registry, `RecommendationPanel`, `AssignmentModal`, resource map layer |
| **6** | Alerts & Escalation | `AlertBanner`, `AlertList`, acknowledge flow, escalation toasts, SLA indicators |
| **7** | Analytics | Four analytics tabs + charts, `HotspotMap`, export CSV, date range controls |
| **8** | Polish | Dark mode, accessibility audit, responsive testing, error boundaries, loading skeletons, empty states, PWA manifest |

---

## 14. Key Files to Create (Checklist)

- [ ] `src/api/client.js`
- [ ] `src/api/incidents.js`
- [ ] `src/api/resources.js`
- [ ] `src/api/dashboard.js`
- [ ] `src/api/analytics.js`
- [ ] `src/hooks/useDashboardSocket.js`
- [ ] `src/hooks/useIncidents.js`
- [ ] `src/hooks/useResources.js`
- [ ] `src/hooks/useAnalytics.js`
- [ ] `src/store/uiStore.js`
- [ ] `src/store/filterStore.js`
- [ ] `src/components/ui/*` (Button, Card, Modal, Badge, Select, DataTable, Toast)
- [ ] `src/components/layout/*` (Sidebar, Header, PageShell)
- [ ] `src/components/maps/*` (IncidentMap, ResourceMap, HotspotMap, MapPicker)
- [ ] `src/components/charts/*` (SeverityChart, TypeChart, DelayChart, StatusChart)
- [ ] `src/components/forms/*` (IncidentReportForm, ResourceForm, AssignmentModal)
- [ ] `src/components/incidents/*` (IncidentCard, IncidentList, IncidentDetail, DuplicateBanner)
- [ ] `src/components/resources/*` (ResourceCard, ResourceTable, RecommendationPanel)
- [ ] `src/components/alerts/*` (AlertBanner, AlertList, EscalationToast)
- [ ] `src/components/ai/*` (AISummaryCard, AIRecommendationsCard)
- [ ] `src/pages/*` (Dashboard, Incidents, IncidentDetail, Resources, Analytics, ReportIncident, Settings)
- [ ] `src/utils/*` (format, validation, mapHelpers, severityIcon, export)
- [ ] `src/styles/index.css`
- [ ] `tailwind.config.js`
- [ ] `.env.example`

---

## 15. Backend Contract Reference (Quick)

| Feature | Endpoint | Method | Key Payload/Response |
|---------|----------|--------|----------------------|
| Create Incident | `/incidents` | POST | `IncidentCreate` → `IncidentOut` |
| List Incidents | `/incidents` | GET | Query: status, severity, type, limit |
| Get Incident | `/incidents/{id}` | GET | `IncidentOut` |
| Update Incident | `/incidents/{id}` | PATCH | `IncidentUpdate` |
| Merge Incidents | `/incidents/{id}/merge` | POST | `{ master_id }` |
| AI Summary | `/incidents/{id}/summary` | GET | `{ summary, recommendations }` |
| Dashboard Overview | `/dashboard/overview` | GET | `{ active_emergencies, severity_breakdown, incidents[] }` |
| Dashboard Alerts | `/dashboard/alerts` | GET | `AlertOut[]` |
| Acknowledge Alert | `/dashboard/alerts/{id}/acknowledge` | PATCH | — |
| WS Dashboard | `/ws/dashboard` | WS | Events: `incident_created`, `incident_updated`, `incident_consolidated`, `incident_escalated`, `resource_assigned` |
| List Resources | `/resources` | GET | `ResourceOut[]` |
| Create Resource | `/resources` | POST | `ResourceCreate` |
| Update Resource Status | `/resources/{id}/status` | PATCH | `{ status }` |
| Recommend Resources | `/resources/recommend/{incident_id}` | GET | `{ recommendations: ResourceOut[] }` |
| Assign Resource | `/resources/assign` | POST | `AssignmentCreate` → `AssignmentOut` |
| Get Assignments | `/resources/assignments/{incident_id}` | GET | `AssignmentOut[]` |
| Analytics: Types | `/analytics/incident-types` | GET | `{ type: count }` |
| Analytics: Delays | `/analytics/response-delays` | GET | `{ average_response_delay_minutes, sla_breaches, sample_size }` |
| Analytics: Shortages | `/analytics/resource-shortages` | GET | `{ by_type, types_with_zero_availability }` |
| Analytics: Hotspots | `/analytics/hotspots` | GET | `[{ lat, lng, incident_count }]` |

---

## 16. Future Enhancements (Post-Hackathon)

- **Offline-first** — Service Worker + IndexedDB for incident reporting in dead zones.
- **Push notifications** — Web Push API (VAPID) for critical alerts.
- **Mobile app** — React Native sharing business logic (api, hooks, store).
- **Role-based views** — Citizen vs Dispatcher vs Commander dashboards.
- **Incident timeline** — Visual chronological event log per incident.
- **Resource tracking** — Live GPS feed for dispatched units (WebSocket `location_update`).
- **Multi-language** — i18next for regional deployments.
- **Audit log** — Immutable event log for compliance.

---

## 17. License & Credits

Internal hackathon project. Built with React, Tailwind, Leaflet, Recharts, TanStack Query, Zustand, and ❤️.
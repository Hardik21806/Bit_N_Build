# PS-9 — Intelligent Emergency Response & Resource Coordination Platform (Backend)

FastAPI backend covering every deliverable in the problem statement: incident intake from multiple sources, AI classification (Groq/Llama with rule-based fallback), duplicate detection & consolidation, resource recommendation & assignment, real-time WebSocket dashboard, SLA-based escalation alerts, email notifications, and analytics.

## 1. Project structure

Place the generated files into this layout inside your backend project root:

```
backend/
├── .env                        # copy env_example.txt → .env and fill in real values
├── requirements.txt
├── schema.sql                  # run in Supabase SQL editor
└── app/
    ├── __init__.py              # empty file, create it manually
    ├── main.py
    ├── config.py
    ├── database.py
    ├── schemas.py
    ├── websocket_manager.py
    ├── routers/
    │   ├── __init__.py           # empty file, create it manually
    │   ├── incidents.py          # from incidents_router.py
    │   ├── resources.py          # from resources_router.py
    │   ├── dashboard.py          # from dashboard_router.py
    │   └── analytics.py          # from analytics_router.py
    └── services/
        ├── __init__.py           # empty file, create it manually
        ├── llm_service.py
        ├── duplicate_service.py
        ├── resource_service.py
        ├── email_service.py
        └── escalation_scheduler.py
```

Rename the downloaded files to match: `incidents_router.py` → `app/routers/incidents.py`, `resources_router.py` → `app/routers/resources.py`, `dashboard_router.py` → `app/routers/dashboard.py`, `analytics_router.py` → `app/routers/analytics.py`, `schema.sql` stays at project root, `env_example.txt` → `.env`. Everything else keeps its name inside `app/` or `app/services/`.

Create three empty `__init__.py` files (`app/__init__.py`, `app/routers/__init__.py`, `app/services/__init__.py`) so Python treats these as packages.

## 2. Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Fill in `.env` with:
- **Supabase**: project URL + service role key (Project Settings → API).
- **Groq**: get a free API key at [console.groq.com](https://console.groq.com), model defaults to `llama-3.3-70b-versatile`.
- **SMTP**: for Gmail, generate an [App Password](https://myaccount.google.com/apppasswords) (not your normal password) and use it as `SMTP_PASSWORD`.
- **ALERT_EMAIL_RECIPIENTS**: comma-separated list of authority/ops emails to receive critical/escalation alerts.

Run the SQL in `schema.sql` inside the Supabase SQL editor to create all tables (`incidents`, `resources`, `assignments`, `alerts`, `notifications_log`, `incident_reports_log`).

Start the server:
```bash
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive Swagger UI, and `http://localhost:8000/health` to confirm Supabase connectivity.

## 3. How each PS requirement is implemented

| Requirement | Endpoint(s) / Module |
|---|---|
| Incident collection (multi-source) | `POST /incidents` accepts `source` = citizen_report/sensor/emergency_call/field_team/hospital/government |
| Classification, severity, priority | `llm_service.classify_incident()` — Groq LLM with a rule-based keyword fallback if the LLM fails |
| Duplicate detection & consolidation | `duplicate_service.py` — geo-distance + fuzzy text match + time window; `POST /incidents/{id}/merge` for manual merges |
| Resource recommendation | `GET /resources/recommend/{incident_id}`, auto-triggered on incident creation |
| Resource assignment / coordination | `POST /resources/assign` |
| Real-time dashboard | `GET /dashboard/overview`, `WS /ws/dashboard` (broadcasts on every create/update/assign/escalate) |
| Alerts & escalation | `escalation_scheduler.py` (background job checks SLA breaches every 60s), `GET /dashboard/alerts` |
| AI summaries & recommendations | `GET /incidents/{id}/summary`, auto-generated on creation and stored on the incident |
| Analytics | `GET /analytics/incident-types`, `/response-delays`, `/resource-shortages`, `/hotspots` |
| Notifications (email) | `email_service.py` — critical incident, escalation, resource shortage, and dispatch-assignment emails, all logged to `notifications_log` |

## 4. Error handling built in

- Every Supabase call goes through `database.py`, which wraps failures in a custom `DBError` and never lets a raw exception escape.
- `main.py` registers global handlers for validation errors (422), `HTTPException`, `DBError` (500), and any unhandled exception (500) — every response follows `{error, detail, status_code}`.
- The Groq LLM calls always have a rule-based fallback (`llm_service.py`), so classification, summaries, and recommendations still work if Groq is down or rate-limited.
- Resource assignment rolls back the resource's status if the assignment insert fails, avoiding "stuck dispatched" resources.
- Email sending retries transient SMTP errors and logs every attempt (success/failure) to `notifications_log`, never crashing the request that triggered it.
- WebSocket broadcasts silently drop dead connections instead of raising.

## 5. Connecting your React + Vite frontend

### a. Base URL and environment variable
In your Vite project, add to `.env`:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/dashboard
```
Use `import.meta.env.VITE_API_BASE_URL` everywhere instead of hardcoding the URL, so you only change one line when you deploy.

### b. CORS
The backend already reads allowed origins from `CORS_ORIGINS` in `.env`. Add your Vite dev server URL (default `http://localhost:5173`) and, later, your deployed frontend URL, comma-separated.

### c. REST calls
Use `fetch` or `axios` against the endpoints in the table above, e.g.:
```js
// src/api/incidents.js
const BASE = import.meta.env.VITE_API_BASE_URL;

export async function createIncident(payload) {
  const res = await fetch(`${BASE}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create incident");
  }
  return res.json();
}

export async function getDashboardOverview() {
  const res = await fetch(`${BASE}/dashboard/overview`);
  return res.json();
}
```
Every error response is JSON `{error, detail, status_code}` — surface `detail` in your UI toast/snackbar.

### d. Real-time dashboard (WebSocket)
```jsx
// src/hooks/useDashboardSocket.js
import { useEffect, useRef, useState } from "react";

export function useDashboardSocket() {
  const [events, setEvents] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(import.meta.env.VITE_WS_URL);
      wsRef.current = ws;

      ws.onmessage = (msg) => {
        const parsed = JSON.parse(msg.data);
        setEvents((prev) => [parsed, ...prev].slice(0, 100));
      };
      ws.onclose = () => setTimeout(connect, 2000); // auto-reconnect
      ws.onerror = () => ws.close();
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  return events;
}
```
Listen for `event` types: `incident_created`, `incident_updated`, `incident_consolidated`, `incident_escalated`, `resource_assigned`. Use these to update your dashboard state (React Query `queryClient.invalidateQueries` or direct state merge) without polling.

### e. Maps (Leaflet / MapLibre)
The backend stores `location_lat` / `location_lng` on every incident and resource. Render markers directly with `react-leaflet`:
```jsx
<MapContainer center={[23.03, 72.58]} zoom={12}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  {incidents.map((inc) => (
    <Marker key={inc.id} position={[inc.location_lat, inc.location_lng]}>
      <Popup>{inc.incident_type} — {inc.severity}</Popup>
    </Marker>
  ))}
</MapContainer>
```

### f. Suggested pages ↔ endpoints
- **Report Incident form** → `POST /incidents`
- **Live Dashboard** → `GET /dashboard/overview` on load + `WS /ws/dashboard` for updates
- **Incident Detail** → `GET /incidents/{id}`, `GET /incidents/{id}/summary`, `GET /resources/recommend/{id}`, `POST /resources/assign`
- **Alerts panel** → `GET /dashboard/alerts`, `PATCH /dashboard/alerts/{id}/acknowledge`
- **Analytics page** → the four `/analytics/*` endpoints, rendered with any chart library (Recharts works well with Tailwind)
- **Resource management** → `GET /resources`, `POST /resources`, `PATCH /resources/{id}/status`

### g. Local dev workflow
1. Start backend: `uvicorn app.main:app --reload --port 8000`
2. Start frontend: `npm run dev` (Vite default port 5173)
3. Confirm `.env` origins match on both sides.
4. Open Swagger docs (`/docs`) to test endpoints directly before wiring up the UI.

# EmergencyOps

## Intelligent Emergency Response & Resource Coordination Platform

EmergencyOps is a web-based emergency response platform designed to centralize incident management, resource coordination, dispatch, real-time monitoring, alerts, mapping, and operational analytics in a single system.

The platform provides emergency response teams with a unified operational view of incidents and available resources, helping them coordinate responses from incident reporting through resolution.

---

## Overview

During an emergency, information can come from multiple sources such as citizens, field teams, emergency services, hospitals, and operational systems.

EmergencyOps brings this information into a centralized platform where incidents can be monitored, resources can be coordinated, assignments can be tracked, and operational alerts can be managed.

### Core Workflow

1. **Incident Report**
2. **Incident Management**
3. **Severity & Status Assessment**
4. **Resource Recommendation**
5. **Resource Assignment**
6. **Dispatch & Response**
7. **Real-Time Monitoring**
8. **Resolution & Analytics**

---

## Key Features

###  Incident Management
* Create and manage emergency incidents
* Track incident type
* Track incident severity
* Track incident status
* View incident details
* Track incident locations
* Monitor reported and assigned timestamps
* Manage incident response information

### Resource Coordination
* View emergency resources
* Monitor resource availability
* Track resource status
* Find available resources
* Recommend resources for incidents
* Assign resources to incidents
* Track assignment status
* Track estimated arrival time

### Assignment Management
Resource assignments can be tracked through sequential response stages:

1. **Assigned**
2. **En Route**
3. **On Scene**
4. **Completed**

*Note: Assignments can also be cancelled when required.*

###  Real-Time Dashboard
The dashboard provides a centralized operational view containing:
* Active incidents
* Incident severity
* Incident status
* Resource assignments
* Active alerts
* Incident locations
* Interactive map
* Incident details
* Response information

###  Alerts & Escalation
The platform provides operational alerts for emergency situations and escalation events.
Alerts can be:
* Viewed from the dashboard
* Filtered by status
* Acknowledged by operators
* Generated through backend operational processes

###  Interactive Map
EmergencyOps uses Leaflet for geographical visualization.
The map provides a geographical view of emergency incidents and operational activity.

###  Operational Analytics
The analytics section provides information about:
* Emergency incident types
* Response performance
* Resource readiness
* Affected areas
* Operational trends

---

## System Architecture

### Architecture Overview

1. **Client / Operators**
   * Emergency Users & System Operators
2. **Frontend Layer (React)**
   * Dashboard, Incidents, Resources, Assignments, Map, Analytics, Alerts
3. **Communication Protocol**
   * REST API & WebSockets
4. **Backend Layer (FastAPI)**
   * Routers, Services, Database Operations, WebSocket Manager, Scheduler
5. **Database Layer**
   * Supabase Database

### Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React | User interface |
| **Build Tool** | Vite | Frontend development and build |
| **Styling** | Tailwind CSS | UI styling |
| **Routing** | React Router | Client-side navigation |
| **Data Fetching** | TanStack Query | Server-state management |
| **State Management** | Zustand | Client-side state |
| **Maps** | Leaflet / React-Leaflet | Geographic visualization |
| **Charts** | Recharts | Analytics visualization |
| **Icons** | Lucide React | UI icons |
| **Forms** | React Hook Form + Zod | Form handling and validation |
| **Backend** | FastAPI | REST API |
| **Server** | Uvicorn | ASGI server |
| **Database** | Supabase | Persistent data storage |
| **Real-Time** | WebSockets | Live operational updates |
| **Backend Language** | Python | Backend services |
| **Frontend Language** | JavaScript / JSX | Frontend application |
| **Notifications** | SMTP / Email | Operational notifications |

---

## Project Structure

```text
EmergencyOps/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── dashboard/
│   │   │   ├── incidents/
│   │   │   ├── resources/
│   │   │   ├── alerts/
│   │   │   ├── analytics/
│   │   │   └── maps/
│   │   │
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── api/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── incidents.py
│   │   │   ├── resources.py
│   │   │   ├── dashboard.py
│   │   │   └── ...
│   │   │
│   │   ├── services/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── websocket_manager.py
│   │   ├── main.py
│   │   └── ...
│   │
│   ├── requirements.txt
│   └── ...
│
├── README.md
└── ...

                    ┌───────────────────────┐
                    │ Emergency Users       │
                    │ & Operators           │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ React Frontend        │
                    │                       │
                    │ Dashboard             │
                    │ Incidents             │
                    │ Resources             │
                    │ Assignments           │
                    │ Map                   │
                    │ Analytics             │
                    │ Alerts                │
                    └───────────┬───────────┘
                                │
                         REST / WebSocket
                                │
                                ▼
                    ┌───────────────────────┐
                    │ FastAPI Backend       │
                    │                       │
                    │ Routers               │
                    │ Services              │
                    │ Database Operations   │
                    │ WebSocket Manager     │
                    │ Scheduler             │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Supabase Database     │
                    └───────────────────────┘
```
## Operational Flow

```
┌───────────────┐
│    Incident   │
│    Report     │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Incident    │
│   Management  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Classification│
│  & Assessment │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Resource    │
│ Recommendation│
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Resource    │
│   Assignment  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    Dispatch   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    Response   │
│   Monitoring  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Resolution  │
└───────────────┘
```
### API Structure

#### Incidents
* `GET /incidents`
* `GET /incidents/{id}`
* `POST /incidents`
* `PATCH /incidents/{id}`
* `POST /incidents/{id}/merge`
* `GET /incidents/{id}/summary`

#### Dashboard
* `GET /dashboard/overview`
* `GET /dashboard/alerts`
* `PATCH /dashboard/alerts/{alert_id}/acknowledge`

**WebSocket Endpoint:**
* `/ws/dashboard`

#### Resources
* `GET /resources`
* `POST /resources`
* `GET /resources/available`
* `PATCH /resources/{resource_id}/status`
* `GET /resources/recommend/{incident_id}`
* `POST /resources/assign`

#### Assignments
* `GET /resources/assignments`
* `GET /resources/assignments/{incident_id}`
* `PATCH /resources/assignments/{assignment_id}/status`

#### Assignment Statuses
* `assigned`
* `en_route`
* `on_scene`
* `completed`
* `cancelled`

---
## Resource Assignment Flow

When a resource is assigned to an incident, the system processes the request sequentially:

1. **Verify resource exists**
2. **Verify resource is available**
3. **Verify incident exists**
4. **Change resource status to dispatched**
5. **Create assignment**
6. **Update incident status when applicable**
7. **Broadcast assignment event**
8. **Send operational notification**

*Note: If assignment creation fails, the resource status is rolled back to its previous available state.*

---

## Real-Time Communication

EmergencyOps uses WebSockets for live dashboard updates.

**WebSocket Endpoint:**
* `ws://127.0.0.1:8000/ws/dashboard`

The frontend maintains a WebSocket connection with the backend and receives operational events.

### Supported Events
* `incident_created`
* `incident_updated`
* `incident_consolidated`
* `incident_escalated`
* `resource_assigned`
* `assignment_updated`

These events allow the operational dashboard to respond to changes without requiring a complete page refresh.

---

## Database

The application uses Supabase for persistent data storage.

### Important Entities

* **`incidents`**: Contains Incident ID, Description, Incident type, Severity, Status, Location, Reported timestamp, and Assignment information.
* **`resources`**: Represents an emergency response resource including Resource ID, Resource name, Resource type, and Resource status.
* **`assignments`**: Connects a resource with an incident including Assignment ID, Incident ID, Resource ID, Assignment status, ETA, and Assigned timestamp.
* **`alerts`**: Represents operational notifications generated by the system.

---

## Maps

The application uses **Leaflet** and **React-Leaflet** for geographic visualization of emergency incidents. Incident markers display information such as incident location and severity.

---

## Analytics

The analytics interface uses **Recharts** to visualize operational information:

* **Emergency Types**: Displays incident distribution by emergency type.
* **Response Performance**: Displays available information related to response timing.
* **Resource Readiness**: Displays information related to resource availability and readiness.
* **Affected Areas**: Displays the distribution of incidents across affected locations.

---

## Environment Variables

Backend configuration is managed using environment variables.

Example `.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_secret_key

GROQ_API_KEY=your_groq_api_key

SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password

CORS_ORIGINS=http://localhost:5173
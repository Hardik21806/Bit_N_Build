"""
app/schemas.py
All Pydantic models: request bodies, response models, and shared enums.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class IncidentSource(str, Enum):
    citizen_report = "citizen_report"
    sensor = "sensor"
    emergency_call = "emergency_call"
    field_team = "field_team"
    hospital = "hospital"
    government = "government"


class IncidentType(str, Enum):
    flood = "flood"
    fire = "fire"
    industrial_accident = "industrial_accident"
    road_accident = "road_accident"
    medical_emergency = "medical_emergency"
    structural_collapse = "structural_collapse"
    other = "other"


class SeverityLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class PriorityLevel(str, Enum):
    P1 = "P1"  # immediate
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"


class IncidentStatus(str, Enum):
    reported = "reported"
    verified = "verified"
    dispatched = "dispatched"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"
    duplicate = "duplicate"


class ResourceType(str, Enum):
    ambulance = "ambulance"
    fire_truck = "fire_truck"
    police_unit = "police_unit"
    rescue_team = "rescue_team"
    medical_team = "medical_team"
    helicopter = "helicopter"
    equipment = "equipment"
    facility = "facility"


class ResourceStatus(str, Enum):
    available = "available"
    dispatched = "dispatched"
    maintenance = "maintenance"
    unavailable = "unavailable"


class AssignmentStatus(str, Enum):
    assigned = "assigned"
    en_route = "en_route"
    on_scene = "on_scene"
    completed = "completed"
    cancelled = "cancelled"


class AlertType(str, Enum):
    critical_incident = "critical_incident"
    delayed_response = "delayed_response"
    escalation = "escalation"
    resource_shortage = "resource_shortage"


class AlertStatus(str, Enum):
    active = "active"
    acknowledged = "acknowledged"
    resolved = "resolved"


# ---------- Location ----------
class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None


# ---------- Incidents ----------
class IncidentCreate(BaseModel):
    source: IncidentSource
    description: str = Field(..., min_length=3, max_length=5000)
    location: Location
    incident_type: Optional[IncidentType] = None
    reporter_contact: Optional[str] = None
    raw_payload: Optional[dict] = None

    @field_validator("description")
    @classmethod
    def strip_description(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("description cannot be empty")
        return v


class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    severity: Optional[SeverityLevel] = None
    priority: Optional[PriorityLevel] = None
    incident_type: Optional[IncidentType] = None
    notes: Optional[str] = None


class IncidentOut(BaseModel):
    id: str
    source: str
    incident_type: Optional[str] = None
    description: str
    location_lat: float
    location_lng: float
    address: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    status: str
    confidence: Optional[float] = None
    duplicate_of: Optional[str] = None
    report_count: int = 1
    ai_summary: Optional[str] = None
    ai_recommendations: Optional[str] = None
    sla_deadline: Optional[str] = None
    reported_at: str
    updated_at: Optional[str] = None


# ---------- Resources ----------
class ResourceCreate(BaseModel):
    name: str
    resource_type: ResourceType
    capacity: int = Field(default=1, ge=1)
    location: Location
    contact: Optional[str] = None
    status: ResourceStatus = ResourceStatus.available


class ResourceOut(BaseModel):
    id: str
    name: str
    resource_type: str
    status: str
    capacity: int
    location_lat: float
    location_lng: float
    contact: Optional[str] = None


class AssignmentCreate(BaseModel):
    incident_id: str
    resource_id: str
    eta_minutes: Optional[int] = None


class AssignmentOut(BaseModel):
    id: str
    incident_id: str
    resource_id: str
    status: str
    eta_minutes: Optional[int] = None
    assigned_at: str


# ---------- Alerts ----------
class AlertOut(BaseModel):
    id: str
    incident_id: Optional[str] = None
    alert_type: str
    message: str
    status: str
    created_at: str


# ---------- Analytics ----------
class AnalyticsSummary(BaseModel):
    total_incidents: int
    by_type: dict
    by_severity: dict
    avg_response_delay_minutes: Optional[float] = None
    resource_shortage_count: int
    hotspot_areas: List[dict] = []


# ---------- Generic API responses ----------
class APIError(BaseModel):
    error: str
    detail: Optional[str] = None
    status_code: int


class PaginatedResponse(BaseModel):
    total: int
    items: list
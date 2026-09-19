export const IncidentSource = {
  CITIZEN_REPORT: 'citizen_report',
  SENSOR: 'sensor',
  EMERGENCY_CALL: 'emergency_call',
  FIELD_TEAM: 'field_team',
  HOSPITAL: 'hospital',
  GOVERNMENT: 'government',
};

export const IncidentType = {
  FLOOD: 'flood',
  FIRE: 'fire',
  INDUSTRIAL_ACCIDENT: 'industrial_accident',
  ROAD_ACCIDENT: 'road_accident',
  MEDICAL_EMERGENCY: 'medical_emergency',
  STRUCTURAL_COLLAPSE: 'structural_collapse',
  OTHER: 'other',
};

export const SeverityLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const PriorityLevel = {
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
};

export const IncidentStatus = {
  REPORTED: 'reported',
  VERIFIED: 'verified',
  DISPATCHED: 'dispatched',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  DUPLICATE: 'duplicate',
};

export const ResourceType = {
  AMBULANCE: 'ambulance',
  FIRE_TRUCK: 'fire_truck',
  POLICE_UNIT: 'police_unit',
  RESCUE_TEAM: 'rescue_team',
  MEDICAL_TEAM: 'medical_team',
  HELICOPTER: 'helicopter',
  EQUIPMENT: 'equipment',
  FACILITY: 'facility',
};

export const ResourceStatus = {
  AVAILABLE: 'available',
  DISPATCHED: 'dispatched',
  MAINTENANCE: 'maintenance',
  UNAVAILABLE: 'unavailable',
};

export const AssignmentStatus = {
  ASSIGNED: 'assigned',
  EN_ROUTE: 'en_route',
  ON_SCENE: 'on_scene',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const AlertType = {
  CRITICAL_INCIDENT: 'critical_incident',
  DELAYED_RESPONSE: 'delayed_response',
  ESCALATION: 'escalation',
  RESOURCE_SHORTAGE: 'resource_shortage',
};

export const AlertStatus = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
};

export const WS_EVENTS = {
  INCIDENT_CREATED: 'incident_created',
  INCIDENT_UPDATED: 'incident_updated',
  INCIDENT_CONSOLIDATED: 'incident_consolidated',
  INCIDENT_ESCALATED: 'incident_escalated',
  RESOURCE_ASSIGNED: 'resource_assigned',
};

export const API_ENDPOINTS = {
  INCIDENTS: '/incidents',
  INCIDENT_DETAIL: (id) => `/incidents/${id}`,
  INCIDENT_SUMMARY: (id) => `/incidents/${id}/summary`,
  INCIDENT_MERGE: (id) => `/incidents/${id}/merge`,
  RESOURCES: '/resources',
  RESOURCES_AVAILABLE: '/resources/available',
  RESOURCE_STATUS: (id) => `/resources/${id}/status`,
  RESOURCE_RECOMMEND: (id) => `/resources/recommend/${id}`,
  RESOURCE_ASSIGN: '/resources/assign',
  RESOURCE_ASSIGNMENTS: (id) => `/resources/assignments/${id}`,
  DASHBOARD_OVERVIEW: '/dashboard/overview',
  DASHBOARD_ALERTS: '/dashboard/alerts',
  ALERT_ACKNOWLEDGE: (id) => `/dashboard/alerts/${id}/acknowledge`,
  ANALYTICS_TYPES: '/analytics/incident-types',
  ANALYTICS_DELAYS: '/analytics/response-delays',
  ANALYTICS_SHORTAGES: '/analytics/resource-shortages',
  ANALYTICS_HOTSPOTS: '/analytics/hotspots',
  HEALTH: '/health',
  WS_DASHBOARD: '/ws/dashboard',
};
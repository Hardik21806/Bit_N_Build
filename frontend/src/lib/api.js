import axios from 'axios';
import { API_ENDPOINTS } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.error || error.message;
      error.userMessage = Array.isArray(message) ? message.join('; ') : message;
    } else if (error.request) {
      error.userMessage = 'Network error. Please check your connection.';
    } else {
      error.userMessage = error.message;
    }
    return Promise.reject(error);
  }
);

export const incidentApi = {
  list: (params = {}) => api.get(API_ENDPOINTS.INCIDENTS, { params }),
  get: (id) => api.get(API_ENDPOINTS.INCIDENT_DETAIL(id)),
  create: (data) => api.post(API_ENDPOINTS.INCIDENTS, data),
  update: (id, data) => api.patch(API_ENDPOINTS.INCIDENT_DETAIL(id), data),
  merge: (id, masterId) => api.post(API_ENDPOINTS.INCIDENT_MERGE(id), { master_id: masterId }),
  getSummary: (id) => api.get(API_ENDPOINTS.INCIDENT_SUMMARY(id)),
};

export const resourceApi = {
  list: (params = {}) => api.get(API_ENDPOINTS.RESOURCES, { params }),
  getAvailable: () => api.get(API_ENDPOINTS.RESOURCES_AVAILABLE),
  create: (data) => api.post(API_ENDPOINTS.RESOURCES, data),
  updateStatus: (id, status) => api.patch(API_ENDPOINTS.RESOURCE_STATUS(id), { status }),
  recommend: (incidentId) => api.get(API_ENDPOINTS.RESOURCE_RECOMMEND(incidentId)),
  assign: (data) => api.post(API_ENDPOINTS.RESOURCE_ASSIGN, data),
  getAssignments: (incidentId) => api.get(API_ENDPOINTS.RESOURCE_ASSIGNMENTS(incidentId)),
  updateAssignmentStatus: (id, status) => api.patch(`/assignments/${id}/status`, { status }),
};

export const dashboardApi = {
  getOverview: () => api.get(API_ENDPOINTS.DASHBOARD_OVERVIEW),
  getAlerts: (status = 'active') => api.get(API_ENDPOINTS.DASHBOARD_ALERTS, { params: { status } }),
  acknowledgeAlert: (id) => api.patch(API_ENDPOINTS.ALERT_ACKNOWLEDGE(id)),
  resolveAlert: (id) => api.patch(`/dashboard/alerts/${id}/resolve`),
};

export const analyticsApi = {
  getIncidentTypes: () => api.get(API_ENDPOINTS.ANALYTICS_TYPES),
  getResponseDelays: () => api.get(API_ENDPOINTS.ANALYTICS_DELAYS),
  getResourceShortages: () => api.get(API_ENDPOINTS.ANALYTICS_SHORTAGES),
  getHotspots: (precision = 2) => api.get(API_ENDPOINTS.ANALYTICS_HOTSPOTS, { params: { precision } }),
};

export const healthApi = {
  check: () => api.get(API_ENDPOINTS.HEALTH),
};

export default api;
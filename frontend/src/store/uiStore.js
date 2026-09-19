import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSidebarStore = create(
  persist(
    (set) => ({
      collapsed: false,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: 'sidebar-store' }
  )
);

export const useWebSocketStore = create((set, get) => ({
  connected: false,
  connecting: false,
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  
  incidents: [],
  setIncidents: (incidents) => set({ incidents }),
  addIncident: (incident) => set((state) => ({ 
    incidents: [incident, ...state.incidents.filter(i => i.id !== incident.id)] 
  })),
  updateIncident: (incident) => set((state) => ({ 
    incidents: state.incidents.map(i => i.id === incident.id ? { ...i, ...incident } : i) 
  })),
  removeIncident: (id) => set((state) => ({ 
    incidents: state.incidents.filter(i => i.id !== id) 
  })),
  
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({ 
    alerts: [alert, ...state.alerts.filter(a => a.id !== alert.id)] 
  })),
  updateAlert: (alert) => set((state) => ({ 
    alerts: state.alerts.map(a => a.id === alert.id ? { ...a, ...alert } : a) 
  })),
  removeAlert: (id) => set((state) => ({ 
    alerts: state.alerts.filter(a => a.id !== id) 
  })),
  
  resources: [],
  setResources: (resources) => set({ resources }),
  updateResource: (resource) => set((state) => ({ 
    resources: state.resources.map(r => r.id === resource.id ? { ...r, ...resource } : r) 
  })),
  
  assignments: {},
  setResourceAssigned: (assignment, incidentId) => set((state) => ({
    assignments: {
      ...state.assignments,
      [incidentId]: [...(state.assignments[incidentId] || []), assignment]
    }
  })),
}));

export const useMapStore = create((set) => ({
  center: [20.5937, 78.9629],
  zoom: 5,
  selectedIncidentId: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedIncident: (id) => set({ selectedIncidentId: id }),
  fitBounds: (bounds) => set({ bounds }),
}));

export const useFilterStore = create(
  persist(
    (set) => ({
      incidentFilters: {
        status: '',
        severity: '',
        incident_type: '',
        search: '',
      },
      resourceFilters: {
        resource_type: '',
        status: '',
      },
      setIncidentFilters: (filters) => set((state) => ({ 
        incidentFilters: { ...state.incidentFilters, ...filters } 
      })),
      setResourceFilters: (filters) => set((state) => ({ 
        resourceFilters: { ...state.resourceFilters, ...filters } 
      })),
      clearIncidentFilters: () => set({ 
        incidentFilters: { status: '', severity: '', incident_type: '', search: '' } 
      }),
      clearResourceFilters: () => set({ 
        resourceFilters: { resource_type: '', status: '' } 
      }),
    }),
    { name: 'filter-store' }
  )
);

export const useNotificationStore = create((set) => ({
  notifications: [],
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications].slice(0, 50) 
  })),
  removeNotification: (id) => set((state) => ({ 
    notifications: state.notifications.filter(n => n.id !== id) 
  })),
  clearNotifications: () => set({ notifications: [] }),
}));
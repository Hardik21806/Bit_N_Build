import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentApi, resourceApi, dashboardApi, analyticsApi, healthApi } from '../lib/api';
import { parseApiError } from '../lib/utils';

export function useIncidents(filters = {}) {
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: () => incidentApi.list(filters),
    select: (response) => response.data,
  });
}

export function useIncident(id) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentApi.get(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

export function useIncidentSummary(id) {
  return useQuery({
    queryKey: ['incident', id, 'summary'],
    queryFn: () => incidentApi.getSummary(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => incidentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Failed to create incident:', parseApiError(error));
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => incidentApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Failed to update incident:', parseApiError(error));
    },
  });
}

export function useMergeIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, masterId }) => incidentApi.merge(id, masterId),
    onSuccess: (_, { id, masterId }) => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incident', masterId] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Failed to merge incident:', parseApiError(error));
    },
  });
}

export function useResources(filters = {}) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: () => resourceApi.list(filters),
    select: (response) => response.data,
  });
}

export function useAvailableResources() {
  return useQuery({
    queryKey: ['resources', 'available'],
    queryFn: () => resourceApi.getAvailable(),
    select: (response) => response.data,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => resourceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (error) => {
      console.error('Failed to create resource:', parseApiError(error));
    },
  });
}

export function useUpdateResourceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => resourceApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources', 'available'] });
    },
    onError: (error) => {
      console.error('Failed to update resource status:', parseApiError(error));
    },
  });
}

export function useResourceRecommendations(incidentId) {
  return useQuery({
    queryKey: ['resources', 'recommend', incidentId],
    queryFn: () => resourceApi.recommend(incidentId),
    select: (response) => response.data,
    enabled: !!incidentId,
  });
}

export function useAssignResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => resourceApi.assign(data),
    onSuccess: (_, { incident_id }) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources', 'available'] });
      queryClient.invalidateQueries({ queryKey: ['incident', incident_id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Failed to assign resource:', parseApiError(error));
    },
  });
}

export function useAssignments(incidentId) {
  return useQuery({
    queryKey: ['assignments', incidentId],
    queryFn: () => resourceApi.getAssignments(incidentId),
    select: (response) => response.data,
    enabled: !!incidentId,
  });
}

export function useAssignmentsForIncidents(incidentIds) {
  return useQuery({
    queryKey: ['assignments', 'bulk', incidentIds?.sort().join(',') || ''],
    queryFn: async () => {
      if (!incidentIds?.length) return {};
      const results = await Promise.all(
        incidentIds.map(id => resourceApi.getAssignments(id).then(r => r.data).catch(() => []))
      );
      return Object.fromEntries(incidentIds.map((id, i) => [id, results[i]]));
    },
    enabled: !!incidentIds?.length,
    staleTime: 30000,
  });
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => dashboardApi.getOverview(),
    select: (response) => response.data,
    refetchInterval: 30000,
  });
}

export function useDashboardAlerts(status = 'active') {
  return useQuery({
    queryKey: ['dashboard', 'alerts', status],
    queryFn: () => dashboardApi.getAlerts(status),
    select: (response) => response.data,
    refetchInterval: 30000,
  });
}

export function useAllDashboardAlerts() {
  return useQuery({
    queryKey: ['dashboard', 'alerts', 'all'],
    queryFn: () => dashboardApi.getAlerts('all'),
    select: (response) => response.data,
    refetchInterval: 30000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => dashboardApi.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'alerts'] });
    },
    onError: (error) => {
      console.error('Failed to acknowledge alert:', parseApiError(error));
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => dashboardApi.resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'alerts'] });
    },
    onError: (error) => {
      console.error('Failed to resolve alert:', parseApiError(error));
    },
  });
}

export function useAnalyticsIncidentTypes() {
  return useQuery({
    queryKey: ['analytics', 'incident-types'],
    queryFn: () => analyticsApi.getIncidentTypes(),
    select: (response) => response.data,
  });
}

export function useAnalyticsResponseDelays() {
  return useQuery({
    queryKey: ['analytics', 'response-delays'],
    queryFn: () => analyticsApi.getResponseDelays(),
    select: (response) => response.data,
  });
}

export function useAnalyticsResourceShortages() {
  return useQuery({
    queryKey: ['analytics', 'resource-shortages'],
    queryFn: () => analyticsApi.getResourceShortages(),
    select: (response) => response.data,
  });
}

export function useAnalyticsHotspots(precision = 2) {
  return useQuery({
    queryKey: ['analytics', 'hotspots', precision],
    queryFn: () => analyticsApi.getHotspots(precision),
    select: (response) => response.data,
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.check(),
    select: (response) => response.data,
    refetchInterval: 60000,
  });
}
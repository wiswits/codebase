import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { DashboardOverview, DashboardStatistics, RecentActivityRow } from '@/lib/types';

export const dashboardService = {
  getOverview: () => apiClient.get<DashboardOverview>(API_ENDPOINTS.DASHBOARD),

  getStatistics: () =>
    apiClient.get<DashboardStatistics>(API_ENDPOINTS.DASHBOARD_STATISTICS),

  getRecentActivity: (limit = 10) =>
    apiClient.get<RecentActivityRow[]>(API_ENDPOINTS.DASHBOARD_ACTIVITY, { limit }),
};

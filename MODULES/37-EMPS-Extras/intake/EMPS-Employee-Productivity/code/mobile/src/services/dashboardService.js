import api from './authService';

export const dashboardService = {
  getStats: () => api.get('/analytics/employee'),
  getRecentActivity: () => api.get('/activities/recent'),
  getNotifications: () => api.get('/notifications'),
};
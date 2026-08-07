import axios from './axios';

export const notificationApi = {
  getNotifications: (params) => axios.get('/notifications', { params }),
  getUnreadCount: () => axios.get('/notifications/unread-count'),
  markAsRead: (id) => axios.put(`/notifications/${id}/read`),
  markAllAsRead: () => axios.put('/notifications/read-all'),
  delete: (id) => axios.delete(`/notifications/${id}`),
};
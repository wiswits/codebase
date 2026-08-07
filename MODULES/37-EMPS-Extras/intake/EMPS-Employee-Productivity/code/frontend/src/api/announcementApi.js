import axios from './axios';

export const announcementApi = {
  getAll: (params) => axios.get('/announcements', { params }),
  getById: (id) => axios.get(`/announcements/${id}`),
  getHolidays: () => axios.get('/announcements/holidays'),
  create: (data) => axios.post('/announcements', data),
  update: (id, data) => axios.put(`/announcements/${id}`, data),
  delete: (id) => axios.delete(`/announcements/${id}`),
  addComment: (id, data) => axios.post(`/announcements/${id}/comments`, data),
};
import axios from './axios';

export const attendanceApi = {
  checkIn: (data) => axios.post('/attendance/check-in', data),
  checkOut: (data) => axios.post('/attendance/check-out', data),
  lunchStart: () => axios.post('/attendance/lunch/start'),
  lunchEnd: () => axios.post('/attendance/lunch/end'),
  getHistory: (params) => axios.get('/attendance/history', { params }),
  getStats: () => axios.get('/attendance/stats'),
  getAll: (params) => axios.get('/attendance/all', { params }),
  correct: (id, data) => axios.put(`/attendance/${id}/correct`, data),
  getDepartment: (departmentId, params) => axios.get(`/attendance/department/${departmentId}`, { params }),
};
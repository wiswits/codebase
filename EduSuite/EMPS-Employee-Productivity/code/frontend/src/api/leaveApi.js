import axios from './axios';

export const leaveApi = {
  apply: (data) => axios.post('/leave/apply', data),
  getMyLeaves: (params) => axios.get('/leave/my-leaves', { params }),
  getBalance: () => axios.get('/leave/balance'),
  getAll: (params) => axios.get('/leave/all', { params }),
  approve: (id, data) => axios.put(`/leave/${id}/approve`, data),
};
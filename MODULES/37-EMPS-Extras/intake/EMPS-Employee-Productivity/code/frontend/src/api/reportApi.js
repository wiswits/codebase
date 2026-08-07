import axios from './axios';

export const reportApi = {
  getAll: (params) => axios.get('/reports', { params }),
  getById: (id) => axios.get(`/reports/${id}`),
  generate: (data) => axios.post('/reports/generate', data),
  submitDaily: (data) => axios.post('/reports/daily', data),
};
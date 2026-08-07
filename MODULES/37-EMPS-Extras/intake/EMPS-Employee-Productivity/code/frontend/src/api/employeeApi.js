import axios from './axios';

export const employeeApi = {
  getAll: (params) => axios.get('/employees', { params }),
  getById: (id) => axios.get(`/employees/${id}`),
  create: (data) => axios.post('/employees', data),
  update: (id, data) => axios.put(`/employees/${id}`, data),
  delete: (id) => axios.delete(`/employees/${id}`),
  suspend: (id) => axios.put(`/employees/${id}/suspend`),
  resetPassword: (id, data) => axios.put(`/employees/${id}/reset-password`, data),
  assignRole: (id, data) => axios.put(`/employees/${id}/assign-role`, data),
};
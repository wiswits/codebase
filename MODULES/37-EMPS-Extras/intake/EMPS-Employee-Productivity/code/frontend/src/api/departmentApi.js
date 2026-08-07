import axios from './axios';

export const departmentApi = {
  getAll: () => axios.get('/departments'),
  getById: (id) => axios.get(`/departments/${id}`),
  getEmployees: (id) => axios.get(`/departments/${id}/employees`),
  create: (data) => axios.post('/departments', data),
  update: (id, data) => axios.put(`/departments/${id}`, data),
  delete: (id) => axios.delete(`/departments/${id}`),
};

import axios from './axios';

export const taskApi = {
  getAll: (params) => axios.get('/tasks', { params }),
  getById: (id) => axios.get(`/tasks/${id}`),
  getMyTasks: (params) => axios.get('/tasks/my-tasks', { params }),
  create: (data) => axios.post('/tasks', data),
  update: (id, data) => axios.put(`/tasks/${id}`, data),
  delete: (id) => axios.delete(`/tasks/${id}`),
  addComment: (id, data) => axios.post(`/tasks/${id}/comments`, data),
  uploadWork: (id, data) => axios.post(`/tasks/${id}/upload-work`, data),
};
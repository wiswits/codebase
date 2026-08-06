import axios from './axios';

export const meetingApi = {
  getAll: (params) => axios.get('/meetings', { params }),
  getById: (id) => axios.get(`/meetings/${id}`),
  getMyMeetings: () => axios.get('/meetings/my-meetings'),
  create: (data) => axios.post('/meetings', data),
  update: (id, data) => axios.put(`/meetings/${id}`, data),
  delete: (id) => axios.delete(`/meetings/${id}`),
  addNotes: (id, data) => axios.post(`/meetings/${id}/notes`, data),
};
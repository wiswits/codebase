import api from './api';

export const enquiryService = {
  board: (params) => api.get('/enquiries/board', { params }),
  list: (params) => api.get('/enquiries', { params }),
  create: (data) => api.post('/enquiries', data),
  updateStage: (id, data) => api.patch(`/enquiries/${id}/stage`, data),
  addContactLog: (id, note) => api.post(`/enquiries/${id}/contact-log`, { note }),
  assignCounselor: (id, counselor) => api.patch(`/enquiries/${id}/assign`, { counselor }),
  changeSource: (id, data) => api.patch(`/enquiries/${id}/source`, data),
};

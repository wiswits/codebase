import axios from './axios';

export const settingApi = {
  getAll: () => axios.get('/settings'),
  getByKey: (key) => axios.get(`/settings/${key}`),
  update: (data) => axios.put('/settings', data),
  delete: (key) => axios.delete(`/settings/${key}`),
  getOfficeLocation: () => axios.get('/settings/office/location'),
  updateOfficeLocation: (data) => axios.put('/settings/office/location', data),
};
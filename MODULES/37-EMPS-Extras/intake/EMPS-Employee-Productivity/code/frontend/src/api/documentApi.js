import axios from './axios';

export const documentApi = {
  getAll: (params) => axios.get('/documents', { params }),
  getById: (id) => axios.get(`/documents/${id}`),
  getPolicies: () => axios.get('/documents/policies'),
  getEmployeeDocs: (employeeId) => axios.get(`/documents/employee/${employeeId}`),
  upload: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'file') {
        formData.append('file', data[key]);
      } else {
        formData.append(key, data[key]);
      }
    });
    return axios.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'file') {
        formData.append('file', data[key]);
      } else {
        formData.append(key, data[key]);
      }
    });
    return axios.put(`/documents/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => axios.delete(`/documents/${id}`),
};
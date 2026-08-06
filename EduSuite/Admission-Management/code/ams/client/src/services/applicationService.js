import api, { publicApi } from './api';

export const applicationService = {
  list: (params) => api.get('/applications', { params }),
  get: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, status) => api.patch(`/applications/${id}/status`, { status }),
  changeSource: (id, data) => api.patch(`/applications/${id}/source`, data),
};

// Public (no-login) multi-step form endpoints (FR1-FR3)
export const publicApplicationService = {
  start: (classAppliedFor) => publicApi.post('/public/applications/start', { classAppliedFor }),
  getDraft: (token) => publicApi.get(`/public/applications/${token}`),
  saveStep: (token, data) => publicApi.patch(`/public/applications/${token}`, data),
  submit: (token) => publicApi.post(`/public/applications/${token}/submit`),
  getChecklist: (classApplied) => publicApi.get(`/public/documents/checklist/${classApplied}`),
  uploadDocument: (docId, file) => {
    const form = new FormData();
    form.append('file', file);
    return publicApi.post(`/public/documents/${docId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getOffer: (token) => publicApi.get(`/public/offers/${token}`),
  decideOffer: (token, decision) => publicApi.post(`/public/offers/${token}/decision`, { decision }),
};

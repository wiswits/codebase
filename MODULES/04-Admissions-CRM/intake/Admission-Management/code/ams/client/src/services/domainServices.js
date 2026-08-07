import api from './api';

export const documentService = {
  getChecklist: (classApplied) => api.get(`/documents/checklist/${classApplied}`),
  setChecklist: (classApplied, requiredDocs) => api.put(`/documents/checklist/${classApplied}`, { requiredDocs }),
  listByApplication: (applicationId) => api.get(`/documents/application/${applicationId}`),
  verificationQueue: () => api.get('/documents/verification-queue'),
  verify: (docId, decision, reason) => api.patch(`/documents/${docId}/verify`, { decision, reason }),
  upload: (docId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/documents/${docId}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const testService = {
  list: () => api.get('/tests'),
  create: (data) => api.post('/tests', data),
  results: (testId, params) => api.get(`/tests/${testId}/results`, { params }),
  bulkUpload: (testId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/tests/${testId}/bulk-upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  override: (resultId, reason) => api.patch(`/tests/results/${resultId}/override`, { reason }),
};

export const interviewService = {
  listSlots: (params) => api.get('/interviews/slots', { params }),
  generateSlots: (data) => api.post('/interviews/slots/generate', data),
  createSlot: (data) => api.post('/interviews/slots', data),
  book: (data) => api.post('/interviews/book', data),
  list: (params) => api.get('/interviews', { params }),
  get: (id) => api.get(`/interviews/${id}`),
  submitScore: (id, scores, remarks) => api.patch(`/interviews/${id}/score`, { scores, remarks }),
  markNoShow: (id) => api.patch(`/interviews/${id}/no-show`),
};

export const offerService = {
  list: (params) => api.get('/offers', { params }),
  generate: (applicationId, data) => api.post(`/offers/${applicationId}/generate`, data),
  getByApplication: (applicationId) => api.get(`/offers/application/${applicationId}`),
};

export const quotaService = {
  list: (params) => api.get('/quotas', { params }),
  dashboard: (params) => api.get('/quotas/dashboard', { params }),
  upsert: (data) => api.post('/quotas', data),
};

export const analyticsService = {
  dashboard: () => api.get('/analytics/dashboard'),
  funnel: (params) => api.get('/analytics/funnel', { params }),
  sourceRoi: () => api.get('/analytics/source-roi'),
  setSourceCost: (data) => api.post('/analytics/source-cost', data),
};

export const authService = {
  users: (role) => api.get('/auth/users', { params: role ? { role } : {} }),
  register: (data) => api.post('/auth/register', data),
};

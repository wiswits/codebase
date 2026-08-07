import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('wiswits_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('wiswits_token');
      localStorage.removeItem('wiswits_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(e);
  }
);

function unwrap(d: any) {
  if (d && d.data !== undefined) return d.data;
  return d;
}

export const qp = {
  bank: {
    stats:    () => api.get('/quiz-portal/bank/stats').then(r => unwrap(r.data)),
    filters:  () => api.get('/quiz-portal/bank/filters').then(r => unwrap(r.data)),
    list:    (params?: any) => api.get('/quiz-portal/bank/questions', { params }).then(r => r.data),
    get:     (id: number)   => api.get(`/quiz-portal/bank/questions/${id}`).then(r => unwrap(r.data)),
    create:  (body: any)    => api.post('/quiz-portal/bank/questions', body).then(r => unwrap(r.data)),
    update:  (id: number, body: any) => api.patch(`/quiz-portal/bank/questions/${id}`, body).then(r => unwrap(r.data)),
    delete:  (id: number)   => api.delete(`/quiz-portal/bank/questions/${id}`).then(r => unwrap(r.data)),
    like:    (id: number)   => api.post(`/quiz-portal/bank/questions/${id}/like`).then(r => unwrap(r.data)),
    bookmark:(id: number)   => api.post(`/quiz-portal/bank/questions/${id}/bookmark`).then(r => unwrap(r.data)),
    importBulk:(body: any)  => api.post('/quiz-portal/bank/import-bulk', body).then(r => unwrap(r.data)),
  },
  assessment: {
    types:     () => api.get('/quiz-portal/assessment/types').then(r => unwrap(r.data)),
    preview:   (body: any) => api.post('/quiz-portal/assessment/preview', body).then(r => unwrap(r.data)),
    publish:   (body: any) => api.post('/quiz-portal/assessment/publish', body).then(r => unwrap(r.data)),
    templates: () => api.get('/quiz-portal/assessment/templates').then(r => unwrap(r.data)),
    saveTemplate: (body: any) => api.post('/quiz-portal/assessment/templates', body).then(r => unwrap(r.data)),
    tests:     (params?: any) => api.get('/quiz-portal/assessment/tests', { params }).then(r => unwrap(r.data)),
    test:      (id: number) => api.get(`/quiz-portal/assessment/tests/${id}`).then(r => unwrap(r.data)),
    deleteTest:(id: number) => api.delete(`/quiz-portal/assessment/tests/${id}`).then(r => unwrap(r.data)),
    duplicate: (id: number) => api.post(`/quiz-portal/assessment/tests/${id}/duplicate`).then(r => unwrap(r.data)),
  },
  attempts: {
    init:    (testId: number) => api.get(`/quiz-portal/attempts/test/${testId}`).then(r => unwrap(r.data)),
    answer:  (attemptId: number, body: any) => api.post(`/quiz-portal/attempts/${attemptId}/answer`, body).then(r => unwrap(r.data)),
    flag:    (attemptId: number, question_id: number) => api.post(`/quiz-portal/attempts/${attemptId}/flag`, { question_id }).then(r => unwrap(r.data)),
    submit:  (attemptId: number, body?: any) => api.post(`/quiz-portal/attempts/${attemptId}/submit`, body || {}).then(r => unwrap(r.data)),
    result:  (attemptId: number) => api.get(`/quiz-portal/attempts/${attemptId}/result`).then(r => unwrap(r.data)),
    my:      () => api.get('/quiz-portal/attempts/my').then(r => unwrap(r.data)),
  },
  analytics: {
    teacher: () => api.get('/quiz-portal/analytics/teacher/overview').then(r => unwrap(r.data)),
    student: () => api.get('/quiz-portal/analytics/student/overview').then(r => unwrap(r.data)),
  },
  auth: {
    // This client sends cookies (withCredentials), so the real session lives in
    // the httpOnly access/refresh cookies. Clearing localStorage alone left the
    // user fully signed in server-side — call the API and WAIT for it before
    // navigating away, or the browser cancels the request.
    logout: async () => {
      try {
        await Promise.race([
          api.post('/auth/logout'),
          new Promise((resolve) => setTimeout(resolve, 4000)),
        ]);
      } catch {}
      localStorage.removeItem('wiswits_token');
      localStorage.removeItem('wiswits_user');
      try { sessionStorage.clear(); } catch {}
      window.location.replace('/login');
    },
    user: () => {
      try { return JSON.parse(localStorage.getItem('wiswits_user') || 'null'); } catch { return null; }
    }
  }
};

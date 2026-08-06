import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL });

// Attach JWT to every authenticated request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ams_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize errors so components can just read err.message
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('ams_token');
      localStorage.removeItem('ams_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(new Error(message));
  }
);

// A second instance for public (no-auth) endpoints - kept separate so we never
// accidentally attach a staff JWT to a parent-facing public form.
export const publicApi = axios.create({ baseURL: API_BASE_URL });
publicApi.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(new Error(err.response?.data?.message || err.message))
);

export default api;

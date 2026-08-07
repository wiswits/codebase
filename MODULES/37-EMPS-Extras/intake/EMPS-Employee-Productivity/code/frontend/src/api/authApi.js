import axios from './axios';

export const authApi = {
  login: (data) => axios.post('/auth/login', data),
  logout: () => axios.post('/auth/logout'),
  forgotPassword: (data) => axios.post('/auth/forgot-password', data),
  resetPassword: (data) => axios.post('/auth/reset-password', data),
  getLoginActivity: () => axios.get('/auth/login-activity'),
  validateToken: () => axios.get('/auth/validate-token'),
};
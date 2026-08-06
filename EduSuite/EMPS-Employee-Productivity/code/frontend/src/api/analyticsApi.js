import axios from './axios';

export const analyticsApi = {
  getAdmin: () => axios.get('/analytics/admin'),
  getEmployee: () => axios.get('/analytics/employee'),
  getTeam: () => axios.get('/analytics/team'),
};
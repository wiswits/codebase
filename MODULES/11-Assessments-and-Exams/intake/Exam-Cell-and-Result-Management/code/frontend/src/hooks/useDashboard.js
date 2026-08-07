import { useQuery } from '@tanstack/react-query';
import api from '../api/axios.js';

export const useDashboardSummary = () =>
  useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data.data,
  });

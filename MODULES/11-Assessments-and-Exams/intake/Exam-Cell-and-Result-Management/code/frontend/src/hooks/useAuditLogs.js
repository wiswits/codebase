import { useQuery } from '@tanstack/react-query';
import api from '../api/axios.js';

export const useAuditLogs = (params) =>
  useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => (await api.get('/audit-logs', { params })).data,
    keepPreviousData: true,
  });

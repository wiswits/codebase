import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export const useInvigilations = (params) =>
  useQuery({
    queryKey: ['invigilations', params],
    queryFn: async () => (await api.get('/invigilation', { params })).data.data,
  });

export const useAutoAssignInvigilators = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/invigilation/auto-assign', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invigilations'] });
      toast.success('Invigilators auto-assigned successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to auto-assign invigilators'),
  });
};

export const useUpdateInvigilation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => (await api.put(`/invigilation/${id}`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invigilations'] });
      toast.success('Assignment updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update assignment'),
  });
};

export const useDeleteInvigilation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/invigilation/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invigilations'] });
      toast.success('Assignment removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove assignment'),
  });
};

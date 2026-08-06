import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export const useBlueprints = (params) =>
  useQuery({
    queryKey: ['blueprints', params],
    queryFn: async () => (await api.get('/blueprints', { params })).data.data,
  });

export const useCreateBlueprint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/blueprints', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blueprints'] });
      toast.success('Blueprint saved successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save blueprint'),
  });
};

export const useUpdateBlueprint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => (await api.put(`/blueprints/${id}`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blueprints'] });
      toast.success('Blueprint updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update blueprint'),
  });
};

export const useDeleteBlueprint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/blueprints/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blueprints'] });
      toast.success('Blueprint deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete blueprint'),
  });
};

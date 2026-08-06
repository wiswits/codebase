import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export const useExamsList = () =>
  useQuery({
    queryKey: ['exams-all'],
    queryFn: async () => (await api.get('/exams', { params: { limit: 100 } })).data.data,
  });

export const useSeatingPlans = (examId) =>
  useQuery({
    queryKey: ['seating', examId],
    queryFn: async () => (await api.get('/seating', { params: examId ? { exam: examId } : {} })).data.data,
  });

export const useGenerateSeatingPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/seating/generate', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seating'] });
      toast.success('Seating plan generated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate seating plan'),
  });
};

export const useUpdateSeatingPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, seats }) => (await api.put(`/seating/${id}`, { seats })).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seating'] });
      toast.success('Seating plan saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save seating plan'),
  });
};

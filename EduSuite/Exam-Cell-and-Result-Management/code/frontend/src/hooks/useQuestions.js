import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export const useQuestions = (params) =>
  useQuery({
    queryKey: ['questions', params],
    queryFn: async () => (await api.get('/questions', { params })).data,
    keepPreviousData: true,
  });

export const useCreateQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/questions', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question added to bank');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add question'),
  });
};

export const useUpdateQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => (await api.put(`/questions/${id}`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update question'),
  });
};

export const useBulkImportQuestions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (questions) => (await api.post('/questions/bulk', { questions })).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success(`${data.count} question(s) imported`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to import questions'),
  });
};

export const useDeleteQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/questions/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete question'),
  });
};

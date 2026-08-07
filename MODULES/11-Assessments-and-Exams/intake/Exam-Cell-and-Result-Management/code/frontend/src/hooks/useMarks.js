import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export const useMarksSheet = (examId) =>
  useQuery({
    queryKey: ['marks-sheet', examId],
    queryFn: async () => (await api.get(`/marks/sheet/${examId}`)).data.data,
    enabled: !!examId,
  });

export const useSaveMarks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/marks/bulk', payload)).data.data,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['marks-sheet', variables.examId] });
      toast.success('Marks saved successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save marks'),
  });
};

export const useModerationQueue = (examId) =>
  useQuery({
    queryKey: ['moderation-queue', examId],
    queryFn: async () => (await api.get(`/marks/moderation/${examId}`)).data.data,
    enabled: !!examId,
  });

export const useModerateMark = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, moderatedMarks, reason }) => (await api.put(`/marks/${id}/moderate`, { moderatedMarks, reason })).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moderation-queue'] });
      toast.success('Mark moderated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to moderate mark'),
  });
};

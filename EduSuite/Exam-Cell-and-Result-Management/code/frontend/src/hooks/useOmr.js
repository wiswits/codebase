import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export const useOMRSheets = (params) =>
  useQuery({
    queryKey: ['omr-sheets', params],
    queryFn: async () => (await api.get('/omr', { params })).data.data,
  });

export const useUploadOMR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, files }) => {
      const formData = new FormData();
      formData.append('examId', examId);
      Array.from(files).forEach((f) => formData.append('sheets', f));
      return (await api.post('/omr/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['omr-sheets'] });
      toast.success(`${data.length} sheet(s) uploaded`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to upload OMR sheets'),
  });
};

export const useEvaluateOMR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/omr/${id}/evaluate`)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['omr-sheets'] });
      toast.success('Sheet evaluated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Evaluation failed'),
  });
};

export const useDeleteOMR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/omr/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['omr-sheets'] });
      toast.success('Sheet removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove sheet'),
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export const usePapers = (params) =>
  useQuery({
    queryKey: ['papers', params],
    queryFn: async () => (await api.get('/papers', { params })).data.data,
  });

export const usePaper = (id) =>
  useQuery({
    queryKey: ['paper', id],
    queryFn: async () => (await api.get(`/papers/${id}`)).data.data,
    enabled: !!id,
  });

export const useGeneratePaper = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/papers/generate', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['papers'] });
      toast.success('Paper set(s) generated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate paper'),
  });
};

export const useDeletePaper = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/papers/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['papers'] });
      toast.success('Paper deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete paper'),
  });
};

export const downloadPaperPdf = async (id, setLabel) => {
  const res = await api.get(`/papers/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `question-paper-set-${setLabel}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

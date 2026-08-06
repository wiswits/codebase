import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export const useHallTickets = (params) =>
  useQuery({
    queryKey: ['hall-tickets', params],
    queryFn: async () => (await api.get('/hall-tickets', { params })).data.data,
  });

export const useGenerateHallTickets = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/hall-tickets/generate', payload)).data.data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['hall-tickets'] });
      toast.success(`${data.length} hall ticket(s) generated`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate hall tickets'),
  });
};

export const downloadHallTicketPdf = async (id, ticketNo) => {
  const res = await api.get(`/hall-tickets/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `hall-ticket-${ticketNo}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

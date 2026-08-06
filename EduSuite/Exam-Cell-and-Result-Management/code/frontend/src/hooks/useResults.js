import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export const useExamsWithResults = () =>
  useQuery({
    queryKey: ['exams-with-results'],
    queryFn: async () => (await api.get('/results/exams-with-results')).data.data,
  });

export const useMyResults = () =>
  useQuery({
    queryKey: ['my-results'],
    queryFn: async () => (await api.get('/results/my')).data.data,
  });

export const useResultsByExam = (examId) =>
  useQuery({
    queryKey: ['results', examId],
    queryFn: async () => (await api.get(`/results/exam/${examId}`)).data.data,
    enabled: !!examId,
  });

export const useResultSummary = (examId) =>
  useQuery({
    queryKey: ['results-summary', examId],
    queryFn: async () => (await api.get(`/results/summary/${examId}`)).data.data,
    enabled: !!examId,
  });

export const useProcessResults = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (examId) => (await api.post(`/results/process/${examId}`)).data.data,
    onSuccess: (_data, examId) => {
      qc.invalidateQueries({ queryKey: ['results', examId] });
      qc.invalidateQueries({ queryKey: ['results-summary', examId] });
      qc.invalidateQueries({ queryKey: ['exams-with-results'] });
      toast.success('Results processed successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to process results'),
  });
};

export const useUpdateResultStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, status }) => (await api.put(`/results/status/${examId}`, { status })).data.data,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['results', variables.examId] });
      toast.success(
        variables.status === 'published' ? 'Results published to students' : `Status updated to ${variables.status}`
      );
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });
};

export const downloadMarksheetPdf = async (resultId, rollNo) => {
  const res = await api.get(`/results/${resultId}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `marksheet-${rollNo || resultId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

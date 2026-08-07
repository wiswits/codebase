import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export const useExamCalendar = (month, year) =>
  useQuery({
    queryKey: ['exam-calendar', month, year],
    queryFn: async () => (await api.get('/exams/calendar', { params: { month, year } })).data.data,
  });

export const useClasses = () =>
  useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes')).data.data,
  });

export const useSubjects = (classId) =>
  useQuery({
    queryKey: ['subjects', classId],
    queryFn: async () => (await api.get('/classes/subjects', { params: classId ? { class: classId } : {} })).data.data,
    enabled: true,
  });

export const useMyClassExams = (classId) =>
  useQuery({
    queryKey: ['my-class-exams', classId],
    queryFn: async () => (await api.get('/exams', { params: { class: classId, limit: 50 } })).data.data,
    enabled: !!classId,
  });

export const useCreateExam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/exams', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-calendar'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Exam scheduled successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to schedule exam'),
  });
};

export const useUpdateExam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => (await api.put(`/exams/${id}`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-calendar'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Exam updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update exam'),
  });
};

export const useDeleteExam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/exams/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-calendar'] });
      toast.success('Exam deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete exam'),
  });
};

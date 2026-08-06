import { useQuery } from '@tanstack/react-query';
import api from '../api/axios.js';

export const usePassFailTrend = (classId) =>
  useQuery({
    queryKey: ['pass-fail-trend', classId],
    queryFn: async () => (await api.get('/reports/pass-fail-trend', { params: classId ? { class: classId } : {} })).data.data,
  });

export const useSubjectPerformance = (classId) =>
  useQuery({
    queryKey: ['subject-performance', classId],
    queryFn: async () => (await api.get('/reports/subject-performance', { params: classId ? { class: classId } : {} })).data.data,
  });

export const useExaminationReport = (examId) =>
  useQuery({
    queryKey: ['examination-report', examId],
    queryFn: async () => (await api.get('/reports/examination', { params: { examId } })).data.data,
    enabled: !!examId,
  });

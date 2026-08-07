import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { DomainSummaryRow, HolisticPreview, Progress } from '@/lib/types';

export const summaryService = {
  getDomainSummary: (studentId: number | string, cycleId: number | string) =>
    apiClient.get<DomainSummaryRow[]>(API_ENDPOINTS.DOMAIN_SUMMARY(studentId, cycleId)),

  getProgress: (studentId: number | string, cycleId: number | string) =>
    apiClient.get<Progress>(API_ENDPOINTS.PROGRESS(studentId, cycleId)),

  getHolisticPreview: (studentId: number | string, cycleId: number | string) =>
    apiClient.get<HolisticPreview>(API_ENDPOINTS.PREVIEW(studentId, cycleId)),
};

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Competency, CompetencyInput } from '@/lib/types';

export const competencyService = {
  list: () => apiClient.get<Competency[]>(API_ENDPOINTS.COMPETENCIES),

  get: (id: number) => apiClient.get<Competency>(API_ENDPOINTS.COMPETENCY(id)),

  create: (input: CompetencyInput) =>
    apiClient.post<Competency>(API_ENDPOINTS.COMPETENCIES, input),

  update: (id: number, input: CompetencyInput) =>
    apiClient.put<Competency>(API_ENDPOINTS.COMPETENCY(id), input),

  remove: (id: number) => apiClient.delete<null>(API_ENDPOINTS.COMPETENCY(id)),
};

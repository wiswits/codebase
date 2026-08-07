import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import {
  FinalizedCard,
  FinalizedCardSummary,
  FinalizeReportCardInput,
  FinalizeReportCardResult,
  PdfPayload,
} from '@/lib/types';

export const cardService = {
  getById: (cardId: number | string) =>
    apiClient.get<FinalizedCard>(API_ENDPOINTS.CARD(cardId)),

  getByStudent: (studentId: number | string, cycleId: number | string) =>
    apiClient.get<FinalizedCard>(API_ENDPOINTS.CARD_BY_STUDENT(studentId, cycleId)),

  getPdfPayload: (cardId: number | string) =>
    apiClient.get<PdfPayload>(API_ENDPOINTS.CARD_PDF(cardId)),

  getRecent: (limit = 10) =>
    apiClient.get<FinalizedCardSummary[]>(API_ENDPOINTS.CARDS_RECENT, { limit }),

  finalize: (input: FinalizeReportCardInput) =>
    apiClient.post<FinalizeReportCardResult>(API_ENDPOINTS.FINALIZE, input),
};

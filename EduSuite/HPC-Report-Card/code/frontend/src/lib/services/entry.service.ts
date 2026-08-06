import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { SaveDraftEntryInput, StudentEntry, WorkflowStatus } from '@/lib/types';

export const entryService = {
  listForStudent: (studentId: number | string, cycleId: number | string) =>
    apiClient.get<StudentEntry[]>(API_ENDPOINTS.STUDENT_ENTRIES(studentId, cycleId)),

  saveDraft: (input: SaveDraftEntryInput) =>
    apiClient.post<StudentEntry>(API_ENDPOINTS.ENTRIES, input),

  remove: (entryId: number) => apiClient.delete<null>(API_ENDPOINTS.ENTRY(entryId)),

  updateWorkflow: (
    studentId: number | string,
    cycleId: number | string,
    status: WorkflowStatus
  ) =>
    apiClient.patch<{ affectedRows: number } | unknown>(
      API_ENDPOINTS.WORKFLOW(studentId, cycleId),
      { status }
    ),
};

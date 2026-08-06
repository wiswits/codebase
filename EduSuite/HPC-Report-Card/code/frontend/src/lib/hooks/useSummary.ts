import { useAsync } from './useAsync';
import { summaryService } from '@/lib/services/summary.service';

export function useDomainSummary(studentId: string, cycleId: string) {
  return useAsync(
    () => summaryService.getDomainSummary(studentId, cycleId),
    [studentId, cycleId],
    { enabled: Boolean(studentId && cycleId) }
  );
}

export function useProgress(studentId: string, cycleId: string) {
  return useAsync(
    () => summaryService.getProgress(studentId, cycleId),
    [studentId, cycleId],
    { enabled: Boolean(studentId && cycleId) }
  );
}

export function useHolisticPreview(studentId: string, cycleId: string) {
  return useAsync(
    () => summaryService.getHolisticPreview(studentId, cycleId),
    [studentId, cycleId],
    { enabled: Boolean(studentId && cycleId) }
  );
}

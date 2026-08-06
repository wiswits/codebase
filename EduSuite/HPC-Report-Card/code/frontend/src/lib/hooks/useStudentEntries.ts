import { useAsync } from './useAsync';
import { entryService } from '@/lib/services/entry.service';

export function useStudentEntries(studentId: string, cycleId: string) {
  return useAsync(
    () => entryService.listForStudent(studentId, cycleId),
    [studentId, cycleId],
    { enabled: Boolean(studentId && cycleId) }
  );
}

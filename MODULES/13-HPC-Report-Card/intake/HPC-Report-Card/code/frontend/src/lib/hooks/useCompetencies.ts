import { useAsync } from './useAsync';
import { competencyService } from '@/lib/services/competency.service';

export function useCompetencies() {
  return useAsync(() => competencyService.list(), []);
}

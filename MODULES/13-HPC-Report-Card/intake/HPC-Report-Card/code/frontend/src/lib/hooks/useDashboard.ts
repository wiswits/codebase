import { useAsync } from './useAsync';
import { dashboardService } from '@/lib/services/dashboard.service';

export function useDashboard() {
  return useAsync(() => dashboardService.getOverview(), []);
}

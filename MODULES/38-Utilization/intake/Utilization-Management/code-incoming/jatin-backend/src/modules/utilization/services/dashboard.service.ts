import { AuthenticatedUser } from '../types';

// Repository layer is owned by another team member and is assumed to
// already exist with these exports.
import { employeeRepository } from '../repositories/employee.repository';
import { allocationRepository } from '../repositories/allocation.repository';
import { utilizationRepository } from '../repositories/utilization.repository';
import { benchRepository } from '../repositories/bench.repository';

export interface DashboardSummaryFilters {
  period_start?: string;
  period_end?: string;
}

export interface DashboardSummary {
  total_employees: number;
  active_allocations: number;
  average_utilization_percentage: number;
  employees_on_bench: number;
  generated_at: string;
}

class DashboardService {
  /**
   * Builds the aggregate dashboard summary for the authenticated user's
   * organization. All figures are scoped by org_id, never trusting any
   * org identifier supplied by the client.
   */
  async getSummary(user: AuthenticatedUser, filters: DashboardSummaryFilters): Promise<DashboardSummary> {
    const orgId = user.org_id;

    const [totalEmployees, activeAllocations, avgUtilization, benchCount] = await Promise.all([
      employeeRepository.countByOrg(orgId, { status: 'active' }),
      allocationRepository.countByOrg(orgId, { status: 'active' }),
      utilizationRepository.getAverageUtilization(orgId, filters.period_start, filters.period_end),
      benchRepository.countActiveByOrg(orgId),
    ]);

    return {
      total_employees: totalEmployees,
      active_allocations: activeAllocations,
      average_utilization_percentage: avgUtilization ?? 0,
      employees_on_bench: benchCount,
      generated_at: new Date().toISOString(),
    };
  }
}

export const dashboardService = new DashboardService();

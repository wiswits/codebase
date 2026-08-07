import { AnalyticsFilter, AuthenticatedUser } from '../types';

import { utilizationRepository } from '../repositories/utilization.repository';
import { benchRepository } from '../repositories/bench.repository';
import { allocationRepository } from '../repositories/allocation.repository';
import { capacityRepository } from '../repositories/capacity.repository';

export interface TrendPoint {
  period: string;
  value: number;
}

export interface AllocationDistributionPoint {
  project_id: string;
  employee_count: number;
  average_allocation_percentage: number;
}

export interface CapacityForecastPoint {
  period: string;
  total_available_hours: number;
  total_allocated_hours: number;
  projected_utilization_percentage: number;
}

class AnalyticsService {
  async getUtilizationTrend(user: AuthenticatedUser, filter: AnalyticsFilter): Promise<TrendPoint[]> {
    return utilizationRepository.getTrend(user.org_id, filter.period_start, filter.period_end, filter.department);
  }

  async getBenchTrend(user: AuthenticatedUser, filter: AnalyticsFilter): Promise<TrendPoint[]> {
    return benchRepository.getTrend(user.org_id, filter.period_start, filter.period_end, filter.department);
  }

  async getAllocationDistribution(
    user: AuthenticatedUser,
    filter: AnalyticsFilter,
  ): Promise<AllocationDistributionPoint[]> {
    return allocationRepository.getDistribution(
      user.org_id,
      filter.period_start,
      filter.period_end,
      filter.department,
    );
  }

  async getCapacityForecast(user: AuthenticatedUser, filter: AnalyticsFilter): Promise<CapacityForecastPoint[]> {
    const rows = await capacityRepository.getForecastRaw(
      user.org_id,
      filter.period_start,
      filter.period_end,
      filter.department,
    );

    return rows.map((row) => ({
      period: row.period,
      total_available_hours: row.total_available_hours,
      total_allocated_hours: row.total_allocated_hours,
      projected_utilization_percentage:
        row.total_available_hours > 0
          ? Math.round((row.total_allocated_hours / row.total_available_hours) * 10000) / 100
          : 0,
    }));
  }
}

export const analyticsService = new AnalyticsService();

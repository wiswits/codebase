import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../utils/response.util';
import { analyticsService } from '../services/analytics.service';
import { AnalyticsFilter, AuthenticatedUser } from '../types';

function buildFilter(req: Request): AnalyticsFilter {
  return {
    period_start: req.query.period_start as string,
    period_end: req.query.period_end as string,
    department: req.query.department as string | undefined,
  };
}

/**
 * GET /api/v1/utilization/analytics/utilization-trend
 */
export const getUtilizationTrend = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const data = await analyticsService.getUtilizationTrend(user, buildFilter(req));

  return sendSuccess(res, data, 'Utilization trend retrieved successfully.');
});

/**
 * GET /api/v1/utilization/analytics/bench-trend
 */
export const getBenchTrend = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const data = await analyticsService.getBenchTrend(user, buildFilter(req));

  return sendSuccess(res, data, 'Bench trend retrieved successfully.');
});

/**
 * GET /api/v1/utilization/analytics/allocation-distribution
 */
export const getAllocationDistribution = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const data = await analyticsService.getAllocationDistribution(user, buildFilter(req));

  return sendSuccess(res, data, 'Allocation distribution retrieved successfully.');
});

/**
 * GET /api/v1/utilization/analytics/capacity-forecast
 */
export const getCapacityForecast = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const data = await analyticsService.getCapacityForecast(user, buildFilter(req));

  return sendSuccess(res, data, 'Capacity forecast retrieved successfully.');
});

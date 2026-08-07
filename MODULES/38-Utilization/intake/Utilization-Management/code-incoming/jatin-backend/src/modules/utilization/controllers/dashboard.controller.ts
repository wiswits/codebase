import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../utils/response.util';
import { dashboardService } from '../services/dashboard.service';
import { AuthenticatedUser } from '../types';

/**
 * GET /api/v1/utilization/dashboard/summary
 */
export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const { period_start, period_end } = req.query as { period_start?: string; period_end?: string };

  const summary = await dashboardService.getSummary(user, { period_start, period_end });

  return sendSuccess(res, summary, 'Dashboard summary retrieved successfully.');
});

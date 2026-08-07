import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../utils/response.util';
import { parsePagination } from '../utils/pagination.util';
import { benchService } from '../services/bench.service';
import { AssignBenchInput, AuthenticatedUser, UnassignBenchInput } from '../types';

/**
 * GET /api/v1/utilization/bench
 */
export const listBench = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const pagination = parsePagination(req.query);

  const result = await benchService.list(user, {
    ...pagination,
    employee_id: req.query.employee_id as string | undefined,
    active_only: req.query.active_only === 'true',
  });

  return sendSuccess(res, result, 'Bench records retrieved successfully.');
});

/**
 * GET /api/v1/utilization/bench/:id
 */
export const getBench = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const record = await benchService.getById(user, req.params.id);

  return sendSuccess(res, record, 'Bench record retrieved successfully.');
});

/**
 * POST /api/v1/utilization/bench/assign
 */
export const assignBench = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as AssignBenchInput;

  const record = await benchService.assign(user, input);

  return sendSuccess(res, record, 'Employee assigned to bench successfully.', 201);
});

/**
 * POST /api/v1/utilization/bench/:id/unassign
 */
export const unassignBench = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as UnassignBenchInput;

  const record = await benchService.unassign(user, req.params.id, input);

  return sendSuccess(res, record, 'Employee unassigned from bench successfully.');
});

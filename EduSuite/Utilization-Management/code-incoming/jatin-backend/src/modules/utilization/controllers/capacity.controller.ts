import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../utils/response.util';
import { parsePagination } from '../utils/pagination.util';
import { capacityService } from '../services/capacity.service';
import { AuthenticatedUser, CreateCapacityInput, UpdateCapacityInput } from '../types';

/**
 * GET /api/v1/utilization/capacity
 */
export const listCapacity = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const pagination = parsePagination(req.query);

  const result = await capacityService.list(user, {
    ...pagination,
    employee_id: req.query.employee_id as string | undefined,
    period_start: req.query.period_start as string | undefined,
    period_end: req.query.period_end as string | undefined,
  });

  return sendSuccess(res, result, 'Capacity plans retrieved successfully.');
});

/**
 * GET /api/v1/utilization/capacity/:id
 */
export const getCapacity = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const record = await capacityService.getById(user, req.params.id);

  return sendSuccess(res, record, 'Capacity plan retrieved successfully.');
});

/**
 * POST /api/v1/utilization/capacity
 */
export const createCapacity = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as CreateCapacityInput;

  const record = await capacityService.create(user, input);

  return sendSuccess(res, record, 'Capacity plan created successfully.', 201);
});

/**
 * PATCH /api/v1/utilization/capacity/:id
 */
export const updateCapacity = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as UpdateCapacityInput;

  const record = await capacityService.update(user, req.params.id, input);

  return sendSuccess(res, record, 'Capacity plan updated successfully.');
});

/**
 * DELETE /api/v1/utilization/capacity/:id
 */
export const deleteCapacity = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  await capacityService.delete(user, req.params.id);

  return sendSuccess(res, null, 'Capacity plan deleted successfully.');
});

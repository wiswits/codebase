import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../utils/response.util';
import { parsePagination } from '../utils/pagination.util';
import { allocationService } from '../services/allocation.service';
import { AuthenticatedUser, CreateAllocationInput, UpdateAllocationInput } from '../types';

/**
 * GET /api/v1/utilization/allocations
 */
export const listAllocations = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const pagination = parsePagination(req.query);

  const result = await allocationService.list(user, {
    ...pagination,
    employee_id: req.query.employee_id as string | undefined,
    project_id: req.query.project_id as string | undefined,
    status: req.query.status as string | undefined,
  });

  return sendSuccess(res, result, 'Allocations retrieved successfully.');
});

/**
 * GET /api/v1/utilization/allocations/:id
 */
export const getAllocation = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const allocation = await allocationService.getById(user, req.params.id);

  return sendSuccess(res, allocation, 'Allocation retrieved successfully.');
});

/**
 * POST /api/v1/utilization/allocations
 */
export const createAllocation = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as CreateAllocationInput;

  const allocation = await allocationService.create(user, input);

  return sendSuccess(res, allocation, 'Allocation created successfully.', 201);
});

/**
 * PATCH /api/v1/utilization/allocations/:id
 */
export const updateAllocation = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as UpdateAllocationInput;

  const allocation = await allocationService.update(user, req.params.id, input);

  return sendSuccess(res, allocation, 'Allocation updated successfully.');
});

/**
 * DELETE /api/v1/utilization/allocations/:id
 */
export const deleteAllocation = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  await allocationService.delete(user, req.params.id);

  return sendSuccess(res, null, 'Allocation deleted successfully.');
});

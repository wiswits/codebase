import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../utils/response.util';
import { parsePagination } from '../utils/pagination.util';
import { utilizationService } from '../services/utilization.service';
import { AuthenticatedUser, CreateUtilizationInput, UpdateUtilizationInput } from '../types';

/**
 * GET /api/v1/utilization/records
 */
export const listUtilization = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const pagination = parsePagination(req.query);

  const result = await utilizationService.list(user, {
    ...pagination,
    employee_id: req.query.employee_id as string | undefined,
    period_start: req.query.period_start as string | undefined,
    period_end: req.query.period_end as string | undefined,
  });

  return sendSuccess(res, result, 'Utilization records retrieved successfully.');
});

/**
 * GET /api/v1/utilization/records/:id
 */
export const getUtilization = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const record = await utilizationService.getById(user, req.params.id);

  return sendSuccess(res, record, 'Utilization record retrieved successfully.');
});

/**
 * POST /api/v1/utilization/records
 */
export const createUtilization = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as CreateUtilizationInput;

  const record = await utilizationService.create(user, input);

  return sendSuccess(res, record, 'Utilization record created successfully.', 201);
});

/**
 * PATCH /api/v1/utilization/records/:id
 */
export const updateUtilization = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as UpdateUtilizationInput;

  const record = await utilizationService.update(user, req.params.id, input);

  return sendSuccess(res, record, 'Utilization record updated successfully.');
});

/**
 * DELETE /api/v1/utilization/records/:id
 */
export const deleteUtilization = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  await utilizationService.delete(user, req.params.id);

  return sendSuccess(res, null, 'Utilization record deleted successfully.');
});

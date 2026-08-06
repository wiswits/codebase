import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../utils/response.util';
import { settingsService } from '../services/settings.service';
import { AuthenticatedUser, UpdateSettingsInput } from '../types';

/**
 * GET /api/v1/utilization/settings
 */
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const settings = await settingsService.get(user);

  return sendSuccess(res, settings, 'Module settings retrieved successfully.');
});

/**
 * PATCH /api/v1/utilization/settings
 */
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as UpdateSettingsInput;

  const settings = await settingsService.update(user, input);

  return sendSuccess(res, settings, 'Module settings updated successfully.');
});

import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../utils/response.util';
import { parsePagination } from '../utils/pagination.util';
import { reportService } from '../services/report.service';
import { AuthenticatedUser, GenerateReportInput } from '../types';

/**
 * GET /api/v1/utilization/reports
 */
export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const pagination = parsePagination(req.query);

  const result = await reportService.list(user, {
    ...pagination,
    report_type: req.query.report_type as string | undefined,
  });

  return sendSuccess(res, result, 'Reports retrieved successfully.');
});

/**
 * GET /api/v1/utilization/reports/:id
 */
export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const record = await reportService.getById(user, req.params.id);

  return sendSuccess(res, record, 'Report retrieved successfully.');
});

/**
 * POST /api/v1/utilization/reports
 */
export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as GenerateReportInput;

  const record = await reportService.generate(user, input);

  return sendSuccess(res, record, 'Report generation queued successfully.', 202);
});

/**
 * GET /api/v1/utilization/reports/:id/download
 */
export const downloadReport = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const download = await reportService.getDownloadUrl(user, req.params.id);

  return sendSuccess(res, download, 'Report download link generated successfully.');
});

/**
 * DELETE /api/v1/utilization/reports/:id
 */
export const deleteReport = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  await reportService.delete(user, req.params.id);

  return sendSuccess(res, null, 'Report deleted successfully.');
});

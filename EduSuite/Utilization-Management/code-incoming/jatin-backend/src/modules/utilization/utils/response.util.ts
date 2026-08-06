import { Response } from 'express';
import { ApiErrorResponse, ApiSuccessResponse } from '../types';

/**
 * Sends a standardized success response as defined by the API Standards
 * section of the Engineering Standard / Utilization Contract.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): Response<ApiSuccessResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Sends a standardized error response.
 * Never forwards raw SQL errors, stack traces or secrets to the client.
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors: Array<{ field?: string; message: string }> = [],
): Response<ApiErrorResponse> {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

/**
 * Wraps async Express route handlers so thrown/rejected errors are
 * forwarded to the centralized Express error handler instead of crashing
 * the process or requiring repetitive try/catch boilerplate in controllers.
 */
export function asyncHandler(
  fn: (req: any, res: any, next: any) => Promise<any>,
) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Known, mapped application error used by services to signal a specific
 * HTTP status + error code back up to the controller/global error handler.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly fieldErrors: Array<{ field?: string; message: string }>;

  constructor(
    message: string,
    statusCode = 400,
    code = 'BAD_REQUEST',
    fieldErrors: Array<{ field?: string; message: string }> = [],
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

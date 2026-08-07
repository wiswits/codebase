import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from './response.util';

/**
 * Runs after express-validator's chain of `check()`/`body()`/`param()`
 * validators on a route. If validation failed, short-circuits with the
 * standardized error response. Otherwise calls next() so the controller
 * can proceed.
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map((err) => ({
      field: 'path' in err ? (err as any).path : undefined,
      message: err.msg,
    }));

    sendError(res, 'Validation failed.', 422, errors);
    return;
  }

  next();
}

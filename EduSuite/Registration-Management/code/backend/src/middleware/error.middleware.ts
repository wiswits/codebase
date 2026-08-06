import {
  NextFunction,
  Request,
  Response,
} from "express";
import { sendError } from "../utils/api-response.js";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFoundMiddleware(
  req: Request,
  res: Response,
): Response {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
  );
}

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  if (error instanceof AppError) {
    return sendError(
      res,
      error.message,
      error.statusCode,
      error.details,
    );
  }

  console.error("Unhandled application error:", error);

  return sendError(
    res,
    "An unexpected server error occurred.",
    500,
  );
}
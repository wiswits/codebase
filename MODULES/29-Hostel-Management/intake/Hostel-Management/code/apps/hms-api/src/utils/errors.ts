import { FastifyReply } from 'fastify';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(code: string, message: string, statusCode: number = 400, details?: Record<string, any>) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }

  send(reply: FastifyReply) {
    return reply.status(this.statusCode).send(this.toJSON());
  }
}

// Common error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super('NOT_FOUND', message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('CONFLICT', message, 409, details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('BUSINESS_RULE_VIOLATION', message, 422, details);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later', 429, { retryAfter });
  }
}

// Error handling helpers
export function handleDatabaseError(error: any): never {
  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // unique violation
      throw new ConflictError('Resource already exists', { constraint: error.constraint });
    case '23503': // foreign key violation
      throw new ConflictError('Resource is being referenced', { constraint: error.constraint });
    case '23514': // check violation
      throw new BusinessRuleError(error.message, { constraint: error.constraint });
    case '42703': // undefined column
      throw new ValidationError('Invalid field specified', { column: error.column });
    default:
      throw new AppError('DATABASE_ERROR', error.message, 500);
  }
}

export function handleZodError(error: any): never {
  const details = error.errors.reduce((acc: Record<string, string>, err: any) => {
    acc[err.path.join('.')] = err.message;
    return acc;
  }, {});
  throw new ValidationError('Invalid request data', details);
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return 'An unknown error occurred';
}

// Error response builder
export function buildErrorResponse(error: AppError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      requestId: undefined, // Will be set by the request context
    },
  };
}
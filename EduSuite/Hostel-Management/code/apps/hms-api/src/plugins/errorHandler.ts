import { FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { config } from '../config';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    requestId?: string;
  };
}

export const errorHandler = (error: FastifyError, request: any, reply: any) => {
  const requestId = request.id || 'unknown';

  // Log error
  request.log.error({
    err: error,
    reqId: requestId,
    url: request.url,
    method: request.method,
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {} as Record<string, string>),
        requestId,
      },
    });
  }

  // Database unique constraint violation
  if (error.code === '23505') {
    return reply.status(409).send({
      error: {
        code: 'CONFLICT',
        message: 'Resource already exists',
        details: { constraint: error.constraint },
        requestId,
      },
    });
  }

  // Foreign key violation
  if (error.code === '23503') {
    return reply.status(409).send({
      error: {
        code: 'CONFLICT',
        message: 'Resource is being referenced',
        details: { constraint: error.constraint },
        requestId,
      },
    });
  }

  // Check violation
  if (error.code === '23514') {
    return reply.status(422).send({
      error: {
        code: 'BUSINESS_RULE_VIOLATION',
        message: error.message || 'Business rule violation',
        requestId,
      },
    });
  }

  // Rate limiting
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        requestId,
      },
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 && config.nodeEnv === 'production'
    ? 'Internal server error'
    : error.message || 'Internal server error';

  return reply.status(statusCode).send({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message,
      requestId,
      ...(config.nodeEnv !== 'production' && { stack: error.stack }),
    },
  });
};
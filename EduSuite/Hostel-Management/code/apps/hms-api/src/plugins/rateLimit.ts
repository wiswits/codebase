import fp from 'fastify-plugin';
import { config } from '../config';

declare module 'fastify' {
  interface FastifyRequest {
    rateLimit?: {
      remaining: number;
      limit: number;
      reset: number;
    };
  }
}

// Simple in-memory rate limiter
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export const rateLimitPlugin = fp(async (fastify) => {
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip rate limiting for health checks
    if (request.url === '/health' || request.url === '/ready') {
      return;
    }

    const key = `${request.ip}:${request.url}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);
    if (!record || record.resetAt < now) {
      // New or expired record
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + config.rateLimitWindow,
      });
      return;
    }

    if (record.count >= config.rateLimitMaxRequests) {
      return reply.status(429).send({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        },
      });
    }

    record.count++;
  });

  // Clean up expired records every hour
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore) {
      if (record.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 3600000);
}, {
  name: 'rate-limit-plugin',
  dependencies: [],
});
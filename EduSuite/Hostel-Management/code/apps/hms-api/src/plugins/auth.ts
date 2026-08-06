import fp from 'fastify-plugin';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { z } from 'zod';
import { config } from '../config';

const jwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  org_id: z.string().uuid(),
  campus_ids: z.array(z.string().uuid()),
  roles: z.array(z.string()),
  student_id: z.string().uuid().optional(),
  parent_of: z.array(z.string().uuid()).optional(),
  exp: z.number(),
  iat: z.number(),
});

export interface User {
  apexUserId: string;
  orgId: string;
  campusIds: string[];
  roles: string[];
  studentId?: string;
  parentOf?: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    user: User;
    token: JWTPayload;
  }
}

let jwksClient: any;

const getJwksClient = () => {
  if (!jwksClient) {
    const { createRemoteJWKSet } = require('jose');
    jwksClient = createRemoteJWKSet(new URL(config.apexJwksUrl));
  }
  return jwksClient;
};

export const authPlugin = fp(async (fastify) => {
  fastify.decorateRequest('user', null);
  fastify.decorateRequest('token', null);

  // Public routes that don't require authentication
  const publicRoutes = ['/health', '/ready', '/docs', '/docs/static', '/docs/json'];

  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for public routes
    if (publicRoutes.some(route => request.url.startsWith(route))) {
      return;
    }

    // Skip auth for OPTIONS requests
    if (request.method === 'OPTIONS') {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
    }

    const token = authHeader.substring(7);
    try {
      const jwksClient = getJwksClient();
      const { payload } = await jwtVerify(token, jwksClient, {
        audience: config.jwtAudience,
        issuer: config.jwtIssuer,
      });

      const validatedPayload = jwtPayloadSchema.parse(payload);

      request.user = {
        apexUserId: validatedPayload.sub,
        orgId: validatedPayload.org_id,
        campusIds: validatedPayload.campus_ids,
        roles: validatedPayload.roles,
        studentId: validatedPayload.student_id,
        parentOf: validatedPayload.parent_of,
      };

      request.token = payload;

    } catch (error) {
      if (error instanceof z.ZodError) {
        fastify.log.error('JWT payload validation error:', error.errors);
        return reply.status(401).send({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token payload structure',
          },
        });
      }

      fastify.log.error('JWT verification error:', error);
      return reply.status(401).send({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }
  });
}, {
  name: 'auth-plugin',
  dependencies: [],
});
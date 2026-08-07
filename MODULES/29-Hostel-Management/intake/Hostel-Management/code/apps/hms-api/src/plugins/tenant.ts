import fp from 'fastify-plugin';
import { db } from '../db';

declare module 'fastify' {
  interface FastifyRequest {
    tenant: {
      orgId: string;
      campusIds: string[];
    };
  }
}

export const tenantPlugin = fp(async (fastify) => {
  fastify.decorateRequest('tenant', null);

  fastify.addHook('preHandler', async (request, reply) => {
    if (!request.user) return;

    // Set tenant context for database queries
    request.tenant = {
      orgId: request.user.orgId,
      campusIds: request.user.campusIds,
    };

    // Set PostgreSQL session variable for RLS
    await db.execute(
      `SELECT set_config('app.org_id', $1, true)`,
      [request.user.orgId]
    );

    // Set campus IDs for RLS
    if (request.user.campusIds.length > 0) {
      await db.execute(
        `SELECT set_config('app.campus_ids', $1, true)`,
        [request.user.campusIds.join(',')]
      );
    }
  });

  // Clean up after request
  fastify.addHook('onResponse', async () => {
    // Reset session variables
    await db.execute(`SELECT set_config('app.org_id', NULL, true)`);
  });
}, {
  name: 'tenant-plugin',
  dependencies: ['auth-plugin'],
});

// Helper to ensure tenant isolation
export function ensureTenantIsolation(tableName: string) {
  return async (request: any, reply: any) => {
    if (!request.tenant?.orgId) {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Tenant context not found',
        },
      });
    }
  };
}
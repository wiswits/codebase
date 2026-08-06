import { FastifyInstance } from 'fastify';
import { db } from '../../../db';
import { ensureTenantIsolation } from '../../../plugins/tenant';

export async function meRoutes(fastify: FastifyInstance) {
  // GET current user permissions
  fastify.get('/me/permissions', {
    preHandler: [ensureTenantIsolation('user')],
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    // Load permissions from database (same as permission plugin)
    const result = await db
      .selectFrom('hms.role_permission')
      .innerJoin('hms.user_role', 'user_role.role_id', 'role_permission.role_id')
      .where('user_role.apex_user_id', '=', request.user.apexUserId)
      .where('user_role.org_id', '=', request.user.orgId)
      .select('role_permission.permission')
      .execute();

    const permissions = result.map(r => r.permission);

    return {
      permissions,
      roles: request.user.roles,
      userId: request.user.apexUserId,
      orgId: request.user.orgId,
    };
  });

  // GET current user info
  fastify.get('/me', {
    preHandler: [ensureTenantIsolation('user')],
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    return {
      apexUserId: request.user.apexUserId,
      orgId: request.user.orgId,
      campusIds: request.user.campusIds,
      roles: request.user.roles,
      studentId: request.user.studentId,
      parentOf: request.user.parentOf,
    };
  });
}
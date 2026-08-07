import fp from 'fastify-plugin';
import { db } from '../db';

declare module 'fastify' {
  interface FastifyRequest {
    permissions: string[];
  }
}

export interface Permission {
  id: string;
  permission: string;
  resource: string;
  action: string;
  scope: string;
}

export const permissionPlugin = fp(async (fastify) => {
  fastify.decorateRequest('permissions', []);

  fastify.addHook('preHandler', async (request, reply) => {
    if (!request.user) return;

    try {
      // Load permissions from database
      const result = await db
        .selectFrom('hms.role_permission')
        .innerJoin('hms.user_role', 'user_role.role_id', 'role_permission.role_id')
        .where('user_role.apex_user_id', '=', request.user.apexUserId)
        .where('user_role.org_id', '=', request.user.orgId)
        .select('role_permission.permission')
        .execute();

      request.permissions = result.map(r => r.permission);

    } catch (error) {
      fastify.log.error('Failed to load permissions:', error);
      request.permissions = [];
    }
  });
}, {
  name: 'permission-plugin',
  dependencies: ['auth-plugin'],
});

// Permission guard helper
export function requirePermission(permission: string) {
  return async (request: any, reply: any) => {
    if (!request.permissions?.includes(permission)) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: `Missing required permission: ${permission}`,
        },
      });
    }
  };
}

export function requireAnyPermission(permissions: string[]) {
  return async (request: any, reply: any) => {
    const hasPermission = permissions.some(p => request.permissions?.includes(p));
    if (!hasPermission) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: `Missing required permissions: ${permissions.join(', ')}`,
        },
      });
    }
  };
}

export function requireAllPermissions(permissions: string[]) {
  return async (request: any, reply: any) => {
    const hasAll = permissions.every(p => request.permissions?.includes(p));
    if (!hasAll) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: `Missing required permissions: ${permissions.join(', ')}`,
        },
      });
    }
  };
}
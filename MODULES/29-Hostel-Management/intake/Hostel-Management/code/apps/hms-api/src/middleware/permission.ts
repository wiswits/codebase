import { FastifyRequest, FastifyReply } from 'fastify';
import { requirePermission, requireAnyPermission, requireAllPermissions } from '../plugins/permissions';

export const permissionMiddleware = {
  requirePermission: (permission: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      return requirePermission(permission)(request, reply);
    };
  },

  requireAnyPermission: (permissions: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      return requireAnyPermission(permissions)(request, reply);
    };
  },

  requireAllPermissions: (permissions: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      return requireAllPermissions(permissions)(request, reply);
    };
  },
};
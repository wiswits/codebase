import { FastifyRequest, FastifyReply } from 'fastify';
import { ensureTenantIsolation } from '../plugins/tenant';

export const tenantMiddleware = {
  ensureTenant: (tableName?: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (tableName) {
        return ensureTenantIsolation(tableName)(request, reply);
      }
      
      if (!request.tenant?.orgId) {
        return reply.status(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Tenant context not found',
          },
        });
      }
    };
  },

  getTenant: (request: FastifyRequest) => {
    return request.tenant;
  },

  getOrgId: (request: FastifyRequest): string | undefined => {
    return request.tenant?.orgId;
  },
};